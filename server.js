import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

let library = { available: false, version: null };
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules', 'tiktok-live-connector', 'package.json'), 'utf8'));
  library = { available: true, version: pkg.version };
} catch {
  library = { available: false, version: null };
}

const tiktok = {
  status: 'offline',
  connected: false,
  username: '',
  roomId: '',
  viewers: 0,
  likes: 0,
  message: 'Not connected.',
  startedAt: 0,
};

let connection = null;
let attemptId = 0;
const clients = new Set();

function statusPayload() {
  return { ...tiktok, library };
}

function sendJson(res, code, body) {
  const raw = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(raw),
    'Cache-Control': 'no-store',
  });
  res.end(raw);
}

function readJson(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function broadcast(type, data) {
  const message = JSON.stringify({ type, data, ts: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(message); } catch { /* ignore broken client */ }
    }
  }
}

function setStatus(patch) {
  Object.assign(tiktok, patch);
  broadcast('status', statusPayload());
}

function cleanUsername(input) {
  let value = String(input || '').trim();
  const urlMatch = value.match(/tiktok\.com\/@?([^/?#\s]+)/i);
  if (urlMatch) value = urlMatch[1];
  value = value.replace(/^@+/, '').replace(/[^\w.-]/g, '');
  return value.slice(0, 64);
}

function pickViewers(roomInfo) {
  if (!roomInfo) return 0;
  const candidates = [
    roomInfo.viewerCount,
    roomInfo.viewer_count,
    roomInfo.data?.user_count,
    roomInfo.data?.stats?.total_user,
    roomInfo.stats?.total_user,
    roomInfo.room?.stats?.total_user,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function friendlyError(error) {
  const raw = String(error?.message || error || 'Unknown error');
  const name = String(error?.name || '');
  const haystack = `${name} ${raw}`;
  if (/offline|not\s+live|UserOffline/i.test(haystack)) {
    return 'That account is not live right now. Start your TikTok LIVE first, then connect.';
  }
  if (/not\s*found|does\s+not\s+exist|UserNotFound/i.test(haystack)) {
    return 'Could not find that TikTok username. Check the spelling (no @ needed).';
  }
  if (/rate|429|too\s+many|quota/i.test(haystack)) {
    return 'The TikTok signing service is rate-limiting this PC. Wait a minute and retry, or add an Euler Stream API key under Advanced.';
  }
  if (/sign|signature|websocket|captcha/i.test(haystack)) {
    return 'TikTok rejected the connection signature. Retry, or add a free Euler Stream API key under Advanced → Connection.';
  }
  if (/network|ENOTFOUND|ECONN|ETIMEDOUT|timeout/i.test(haystack)) {
    return 'Network error while reaching TikTok. Check your internet and try again.';
  }
  return `Could not connect: ${raw.slice(0, 220)}`;
}

function bindConnection(conn, lib, myAttempt) {
  const events = lib.WebcastEvent || {};
  const on = (key, fallback, handler) => {
    const name = events[key] || fallback;
    conn.on(name, (data) => {
      if (myAttempt !== attemptId) return;
      try { handler(data || {}); } catch (error) {
        console.error(`[tiktok] ${fallback} handler failed:`, error);
      }
    });
  };

  on('GIFT', 'gift', (data) => {
    const details = data.giftDetails || {};
    const extended = data.extendedGiftInfo || {};
    const giftType = Number(details.giftType ?? extended.giftType ?? 0);
    // Streakable gifts emit many progress events. Only act on the final one.
    if (giftType === 1 && !data.repeatEnd) return;
    const repeatCount = Math.max(1, Number(data.repeatCount) || 1);
    const giftName = details.giftName || extended.name || extended.describe || `Gift ${data.giftId ?? ''}`.trim();
    const user = data.user || {};
    broadcast('event', {
      event: 'gift',
      data: {
        giftName,
        giftId: data.giftId ?? null,
        repeatCount,
        giftType,
        diamondCount: Number(extended.diamond_count ?? details.diamondCount ?? 0) || 0,
        user: {
          uniqueId: user.uniqueId || '',
          nickname: user.nickname || user.uniqueId || 'Viewer',
        },
      },
    });
  });

  on('LIKE', 'like', (data) => {
    const user = data.user || {};
    const total = Number(data.totalLikeCount) || tiktok.likes;
    tiktok.likes = Math.max(tiktok.likes, total);
    broadcast('event', {
      event: 'like',
      data: {
        likeCount: Number(data.likeCount) || 0,
        totalLikeCount: total,
        user: { uniqueId: user.uniqueId || '', nickname: user.nickname || user.uniqueId || 'Viewer' },
      },
    });
  });

  on('ROOM_USER', 'roomUser', (data) => {
    const viewers = Number(data.viewerCount);
    if (Number.isFinite(viewers) && viewers >= 0 && viewers !== tiktok.viewers) {
      tiktok.viewers = viewers;
      broadcast('status', statusPayload());
    }
  });

  on('FOLLOW', 'follow', (data) => {
    const user = data.user || {};
    broadcast('event', {
      event: 'follow',
      data: { user: { uniqueId: user.uniqueId || '', nickname: user.nickname || user.uniqueId || 'Viewer' } },
    });
  });

  on('SHARE', 'share', (data) => {
    const user = data.user || {};
    broadcast('event', {
      event: 'share',
      data: { user: { uniqueId: user.uniqueId || '', nickname: user.nickname || user.uniqueId || 'Viewer' } },
    });
  });

  conn.on('disconnected', () => {
    if (myAttempt !== attemptId) return;
    if (!tiktok.connected && tiktok.status !== 'connected') return;
    connection = null;
    setStatus({
      connected: false,
      status: 'offline',
      viewers: 0,
      message: 'Disconnected from TikTok.',
      startedAt: 0,
    });
  });

  conn.on('streamEnd', () => {
    if (myAttempt !== attemptId) return;
    connection = null;
    setStatus({
      connected: false,
      status: 'offline',
      viewers: 0,
      message: 'The TikTok LIVE stream ended.',
      startedAt: 0,
    });
  });

  conn.on('error', (error) => {
    console.error('[tiktok] connection error:', error?.message || error);
  });
}

async function connectTikTok({ username, signApiKey, sessionId, ttTargetIdc }) {
  const clean = cleanUsername(username);
  if (!clean) {
    setStatus({ status: 'error', connected: false, message: 'Enter your TikTok username first.' });
    return;
  }

  const myAttempt = ++attemptId;
  const previous = connection;
  connection = null;
  if (previous) {
    try { await previous.disconnect(); } catch { /* ignore */ }
  }

  Object.assign(tiktok, {
    status: 'connecting',
    connected: false,
    username: clean,
    roomId: '',
    viewers: 0,
    likes: 0,
    startedAt: 0,
    message: `Connecting to @${clean}…`,
  });
  broadcast('status', statusPayload());

  let lib;
  try {
    lib = await import('tiktok-live-connector');
  } catch (error) {
    console.error('[tiktok] import failed:', error);
    setStatus({
      status: 'error',
      connected: false,
      message: 'TikTok library is not installed. Run "npm install" in the snake-mod-live folder, then restart the server.',
    });
    return;
  }
  if (myAttempt !== attemptId) return;

  const options = {
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: true,
    webClientOptions: { timeout: { request: 20000 } },
    wsClientOptions: { handshakeTimeout: 25000 },
    ...(signApiKey ? { signApiKey } : {}),
    ...(sessionId && ttTargetIdc ? {
      session: {
        cookie: {
          type: 'cookie',
          value: { sessionId: String(sessionId), ttTargetIdc: String(ttTargetIdc) },
        },
      },
    } : {}),
  };

  let conn;
  try {
    conn = new lib.TikTokLiveConnection(clean, options);
  } catch (error) {
    console.error('[tiktok] constructor failed:', error);
    if (myAttempt === attemptId) {
      setStatus({ status: 'error', connected: false, message: friendlyError(error) });
    }
    return;
  }

  connection = conn;
  bindConnection(conn, lib, myAttempt);

  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Connection timed out after 60 seconds')), 60000);
  });

  try {
    const state = await Promise.race([conn.connect(), timeoutPromise]);
    clearTimeout(timeoutHandle);
    if (myAttempt !== attemptId) {
      try { await conn.disconnect(); } catch { /* ignore */ }
      return;
    }
    const roomId = String(state?.roomId || conn.roomId || '');
    const viewers = pickViewers(state?.roomInfo || conn.roomInfo);
    Object.assign(tiktok, {
      connected: true,
      status: 'connected',
      roomId,
      viewers,
      message: `Connected to @${clean}'s LIVE.`,
      startedAt: Date.now(),
    });
    broadcast('status', statusPayload());
    console.log(`[tiktok] connected to @${clean} (room ${roomId || '?'})`);
  } catch (error) {
    clearTimeout(timeoutHandle);
    if (myAttempt !== attemptId) return;
    console.error('[tiktok] connect failed:', error?.message || error);
    connection = null;
    setStatus({
      connected: false,
      status: 'error',
      viewers: 0,
      roomId: '',
      message: friendlyError(error),
    });
    try { await conn.disconnect(); } catch { /* ignore */ }
  }
}

async function disconnectTikTok(message = 'Disconnected.') {
  ++attemptId;
  const old = connection;
  connection = null;
  if (old) {
    try { await old.disconnect(); } catch { /* ignore */ }
  }
  Object.assign(tiktok, {
    connected: false,
    status: 'offline',
    viewers: 0,
    roomId: '',
    startedAt: 0,
    message,
  });
  broadcast('status', statusPayload());
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');

  try {
    if (requestUrl.pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, status: statusPayload() });
    }

    if (requestUrl.pathname === '/api/tiktok/connect' && req.method === 'POST') {
      const body = await readJson(req);
      connectTikTok(body).catch((error) => console.error('[tiktok] unexpected:', error));
      return sendJson(res, 200, { ok: true, message: 'Connecting…' });
    }

    if (requestUrl.pathname === '/api/tiktok/disconnect' && req.method === 'POST') {
      await disconnectTikTok('Disconnected.');
      return sendJson(res, 200, { ok: true });
    }

    // Local-only test injection. Useful for OBS / multi-tab testing.
    if (requestUrl.pathname === '/api/test' && req.method === 'POST') {
      const body = await readJson(req);
      if (!body.event) return sendJson(res, 400, { ok: false, message: 'Missing event type.' });
      broadcast('event', { event: body.event, data: body.data || {}, test: true });
      return sendJson(res, 200, { ok: true });
    }

    if (requestUrl.pathname.startsWith('/api/')) {
      return sendJson(res, 404, { ok: false, message: 'Unknown API route.' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end('Method not allowed');
    }

    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      res.writeHead(400);
      return res.end('Bad request');
    }
    if (pathname === '/') pathname = '/index.html';
    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }

    const relative = pathname.replace(/^[/\\]+/, '');
    const filePath = path.resolve(PUBLIC_DIR, relative);
    if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': stats.size,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (error) {
    console.error('[http]', error);
    if (!res.headersSent) sendJson(res, 500, { ok: false, message: 'Server error.' });
    else res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  let pathname = '/';
  try { pathname = new URL(req.url || '/', 'http://localhost').pathname; } catch { /* ignore */ }
  if (pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', () => { /* clients do not command the server */ });
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
  try {
    ws.send(JSON.stringify({ type: 'status', data: statusPayload(), ts: Date.now() }));
  } catch { /* ignore */ }
});

const heartbeat = setInterval(() => {
  for (const ws of clients) {
    if (ws.isAlive === false) {
      clients.delete(ws);
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch { /* ignore */ }
  }
}, 30000);
heartbeat.unref?.();

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Close the other Snake Mod Live window or set PORT=3001.\n`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('\n  🐍  SNAKE MOD LIVE');
  console.log(`      Game:   http://localhost:${PORT}`);
  console.log(`      OBS:    http://localhost:${PORT}/?obs=1&autoplay=1`);
  console.log(`      TikTok: connect from the TikTok tab in the game menu`);
  console.log(`      Library: ${library.available ? `tiktok-live-connector v${library.version}` : 'NOT INSTALLED (run npm install)'}\n`);
});

process.on('SIGINT', async () => {
  await disconnectTikTok('Server stopped.');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
});
