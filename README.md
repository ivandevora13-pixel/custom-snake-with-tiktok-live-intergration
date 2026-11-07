# Snake Mod Live

A fan-made, Google-Snake-style game with an oversized "everything" menu and **TikTok Live gift triggers**. Start your LIVE, connect your username, and let viewers drop food, shields, portals, bombs, confetti and chaos onto the run.

Everything runs locally on your PC. TikTok is optional: with no connection the game still plays normally, and the built-in **Gift lab** and **Demo mode** let you test every effect offline.

> This is not an official Google or TikTok product. The TikTok Live connector is unofficial and can break when TikTok changes its internals. The game itself always works offline.

---

## What's in this download

- **`start.bat`** — double-click this to launch on Windows.
- **`README.txt`** — a one-minute quick start.
- **`README.md`** — this full guide.
- **`public/`**, **`server.js`**, **`package.json`** — the game and its local server.
- **`node_modules/`** — dependencies are bundled, so the first launch does **not** need `npm install` or internet. (If the folder is missing, `start.bat` installs them automatically.)

---

## Features

- **Smooth motion** — the snake glides between grid cells instead of jumping, with fading food pickup animations. Turns, growth, speed boosts and slow motion all blend continuously; collisions and scoring stay grid-accurate.
- **5 game modes** — Classic, Maze, Portals, Time Attack, Chaos.
- **Board control** — four presets plus custom columns/rows, speed, acceleration, start length, growth, food count, walls, portal pairs, extra lives and round timers.
- **Looks** — light/dark menu UI, 5 board themes, 8 snake skins, 3 body patterns, 10 foods and toggles for grid, eyes, particles and screen shake.
- **Sound** — synthesized Web Audio effects (no asset files), volume, UI clicks and optional spoken gift thank-yous.
- **TikTok Live** — gifts, gift streaks/combos, likes, new followers and shares can each trigger in-game effects.
- **Gift rules** — map any gift name to any effect, with per-rule amount and on/off switch. First match wins.
- **Gift lab** — fire a test gift with any combo count, test engagement events, or run Demo mode.
- **Live feed** — latest 40 events in the side rail and TikTok tab.
- **OBS clean mode** — hides the app chrome and auto-starts a run, with a transparent page background.
- **Local settings** — auto-saved, plus JSON export/import that omits connection secrets.
- **No accounts, no cloud.** The server listens on `127.0.0.1` only.

---

## Requirements

- Windows 10 or 11 (the launcher targets Windows; the server is plain Node.js and also runs elsewhere).
- **Node.js 20 or newer** — the TikTok connector is ESM-only and requires Node 20+. Tested with Node 26.13.0 and `tiktok-live-connector` 2.5.0.
- **No internet needed to play** — dependencies are bundled. Internet is only needed for TikTok Live, or to run `npm install` if you use a source-only copy.
- Optional: OBS Studio for the clean stream view.

---

## Quick start

1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org/) (keep "Add to PATH" checked). You only need this once.
2. Double-click **`start.bat`** in this folder.
   - It finds Node even when it is not on `PATH`.
   - Dependencies are already bundled; if `node_modules` is missing it runs `npm install` automatically.
   - It starts the local server and opens the game in your browser.
3. Click **Play** (or press `Space`) and enjoy.

To stop the app, close the **Snake Mod Live Server** console window. `Ctrl+C` in that window also works.

### Manual launch

```bat
cd path\to\snake-mod-live
npm start
```

Then open `http://localhost:3000/`. The server prints the game, OBS and TikTok URLs when it starts. Run `npm install` first only if `node_modules` is missing.

If port 3000 is already occupied, close the other Snake Mod Live window, or use another port:

```bat
set PORT=3001
start.bat
```

The launcher opens the port you set. For a manual launch, use `set PORT=3001` followed by `npm start`. Remember to update the OBS browser-source URL if you change the port.

To start without opening a browser window, set `SNAKE_NO_BROWSER=1` before running `start.bat`.

---

## How to play

| Input | Action |
| --- | --- |
| Arrow keys / `WASD` | Steer |
| `Space` | Start, pause, resume, or cancel the countdown |
| `R` | Restart the current run |
| `M` | Open/close the menu |
| `F` | Toggle fullscreen |
| `Escape` | Close the menu or exit fullscreen |
| Swipe | Steer on touch screens |

Eat food, avoid walls, your own tail and hazards. Golden food is worth 5 points and disappears after roughly 12 seconds. Extra lives absorb one crash each. A countdown and a 4-second auto-restart are available for stream use.

### Smooth motion

The snake is animated between grid cells and the food you eat fades out as the head arrives, so movement looks fluid even at slower speeds. Speed boosts and slow motion blend in without a jump, and the animation pauses cleanly with the game. Wraps, portals and respawns intentionally snap to their destination.

### Game modes

| Mode | What it does |
| --- | --- |
| **Classic** | Pure snake, solid walls, no timer. |
| **Maze** | Generates a fresh wall labyrinth every run. |
| **Portals** | Twin portal pairs; the board edges wrap around. |
| **Time Attack** | 60-second score sprint. |
| **Chaos** | Fires a random effect every few seconds; gifts stack on top. |

Changing a mode applies its preset (walls, timer, obstacles, portals). You can still fine-tune everything afterwards under **Menu → Mods**.

### Menu tabs

- **Play** — mode picker, current best, board/speed summary, keyboard reference.
- **Mods** — board size and shape, start length, growth, food count, speed, acceleration, wall behavior, hazards, portals, golden-food chance, lives, timer, chaos interval, countdown, auto-restart, pause-on-blur.
- **Look** — UI theme, board theme, snake skin, body pattern, food, visual effects.
- **Sound** — SFX volume, UI clicks, test buttons, voice callouts and voice speed.
- **TikTok** — connection, engagement triggers, gift rules, Gift lab, Demo mode, live feed.
- **Help** — four-step go-live guide, notes, export/import and full reset.

---

## TikTok Live setup

1. **Go live on TikTok first.** The connector needs an active LIVE room.
2. Open **Menu → TikTok**.
3. Enter your TikTok username without the `@` (a profile URL also works) and click **Connect**.
4. Wait for the status to change to connected. Viewers, likes and room ID appear in the panel and side rail.
5. Use **Gift lab** to test a gift, then start a run.

Notes:

- The connection lives on the local server, not in the page. Reloading the game keeps it connected; use **Disconnect** when you are finished. Restarting the server drops it.
- Only one TikTok connection is active per server.
- No TikTok login is required just to read gifts.
- Gift names are localized by TikTok. If a viewer's client shows a translated name, add that exact name as a rule. Matching is case-insensitive.
- Streakable gifts emit many progress events. Snake Mod Live triggers once when the streak ends, using the final combo count.
- If the free signing service is rate-limited, open **Advanced / connection troubleshooting** and add an optional [Euler Stream](https://www.eulerstream.com) API key. Session cookies are optional, are not needed to read gifts, and stay on this PC. Leave them blank unless you know you need them.
- The connector is unofficial. If TikTok changes its internals, gifts may stop until the connector library is updated.

---

## Gift mapping

Open **Menu → TikTok → Gift → action rules**.

- Each row is matched against the English gift name, case-insensitively.
- **First enabled matching rule wins.** Disable or delete rules you do not want.
- Set the **effect** and **amount** per rule. Amounts are clamped to sane limits in the UI.
- Click the **▶** button on a row to fire it immediately, using the combo count currently set in Gift lab.
- **Add gift rule** creates a new row; the gift-name field offers 30+ common gifts.
- **Reset defaults** restores the built-in rule set.

### Default examples

| Gift | Effect |
| --- | --- |
| Rose | Spawn 1 food |
| TikTok | +10 score |
| Ice Cream Cone | 5s slow motion |
| Corgi | Shrink 2 segments |
| Hand Hearts | +1 extra life |
| Galaxy | 15s rainbow snake |
| Lion | Confetti |
| Universe | 10s frenzy |
| Money Gun | +100 score |
| Private Jet | 20s frenzy |

The full default list ships with 24 rules and covers food, score, shields, ghost mode, reverse controls, golden food, hazards and more. Everything is editable.

### Combo scaling

**Scale with combo count** multiplies the rule amount by the final streak count, with safety caps:

- Timed effects: up to **120 seconds**.
- Food: up to **8**; golden food up to **4**.
- Grow/shrink: up to **12** segments.
- Extra lives: up to **5** total.
- Bombs/walls: up to **6**.
- Time bonus: up to **120 seconds**.
- **Score bonuses scale freely** by the combo count.

**Unmapped gifts** can be set to do nothing (default), spawn food, confetti, or give a small score bonus.

### Engagement triggers

- **Every N likes** → an effect (disabled by default; default step 25).
- **New follower** → an effect (default: extra life).
- **Stream shared** → an effect (default: confetti).

Every N **new** likes triggers the effect. Progress is tracked from incoming like updates; use the Gift lab's `+25 likes` button to simulate a batch.

### Gift lab and Demo mode

No live account needed:

1. Type a gift name (or pick one), set a combo count, and click **Fire test**.
2. Use **Test follow**, **Test share**, **+25 likes** or **Confetti** for engagement tests.
3. Turn on **Demo mode** to fire a random enabled gift every few seconds — useful for previewing the OBS scene.

Test and demo events are labelled in the feed and never touch TikTok.

---

## OBS clean view

Use this URL as an **OBS Browser source**:

```
http://localhost:3000/?obs=1&autoplay=1
```

- `obs=1` hides the top bar, live rail, hint bar and normal Play button, and makes the page background transparent.
- `autoplay=1` starts a run automatically a moment after the page loads. The normal countdown setting still applies.
- Set the source size to your canvas (for example 1920×1080). The board scales to fit.
- A small **Menu** button remains in OBS mode for configuration. In OBS, right-click the source and choose **Interact** to use it.
- OBS's embedded browser has its **own localStorage**. Configure the menu inside OBS once, use **Window Capture** instead, or export your settings from the normal browser and import them in the OBS copy.
- For sound effects, enable **Control audio via OBS** in the browser source properties and check the source volume. Web Audio may require one click/interaction in a normal browser; OBS usually allows it automatically.
- The clean URL is also available from **Menu → TikTok → Copy OBS clean URL**.

The OBS URL only works while the local server is running and only from the same machine (the server binds to `127.0.0.1`).

---

## Offline use

TikTok is entirely optional:

- Dependencies are bundled, so the game runs without internet or a first `npm install`.
- The game, modes, themes, settings, sounds and local best score work with no internet.
- **Gift lab**, **Demo mode** and the engagement test buttons exercise the full trigger pipeline offline.
- No external fonts, images or audio files are fetched. Sounds are synthesized in the browser.
- Export your settings once if you want a backup that survives clearing browser storage.

---

## Settings, export and import

Settings save automatically to this browser under:

- `snakeModLive.settings.v1` — all mods, looks, sounds and gift rules.
- `snakeModLive.best.v1` — best score.

**Menu → Help → Export settings** downloads a JSON file. **Import settings** replaces the current mods, rules and colors.

Connection secrets (`tiktokSignKey`, `tiktokSessionId`, `tiktokIdc`) are omitted from exports and preserved when importing, so a shared settings file never contains your keys or cookies. Your TikTok username is kept because it is not a secret.

**Reset everything** clears all settings, gift rules and the best score, then reloads with defaults. It cannot be undone.

Browser storage is per-browser and per-origin. Chrome, Edge, Firefox, and OBS's embedded browser each keep a separate copy.

---

## Troubleshooting

### `start.bat` says Node.js was not found

Install the 64-bit Node.js LTS from [nodejs.org](https://nodejs.org/) and run `start.bat` again. If Node is in a non-standard folder, add it to `PATH` or start manually with the full path:

```bat
"C:\Program Files\nodejs\node.exe" server.js
```

### Port 3000 is already in use

A previous server window is probably still open. Close it, or run on another port:

```bat
set PORT=3001
start.bat
```

Then use `http://localhost:3001/` (and update OBS). If you use a source-only copy, run `npm start` instead of `start.bat` after setting the port.

### TikTok will not connect

- Make sure the account is **currently LIVE**; scheduled or ended streams will fail.
- Check the username spelling; it is the streamer's account, not a viewer's.
- Verify your internet connection and check the server console for the detailed error.
- If you see a rate-limit or signature error, wait a minute and retry, or add an optional Euler Stream API key under **Advanced**.
- The connector is unofficial; if TikTok changed something, update dependencies with `npm update tiktok-live-connector`.

### Gifts arrive but nothing happens

- The run must be **playing** for gameplay effects (confetti, restart and pause have their own rules).
- Check the gift name exactly as TikTok reports it, including localization.
- Make sure the rule is enabled and its effect is not **Do nothing**.
- Remember that streak gifts trigger only when the combo ends.
- Test the same gift in **Gift lab** to confirm the rule itself works.

### No sound

- Click once inside the game to unlock Web Audio in a normal browser.
- Check **Menu → Sound → Sound on** and the SFX volume.
- In OBS, enable **Control audio via OBS** on the browser source and unmute it.
- Voice callouts require a speech-synthesis voice for your browser language; use **Test voice**.

### OBS shows a blank/black page

- Start the server first and confirm `http://localhost:3000/` opens normally.
- Use the exact URL including `?obs=1&autoplay=1`.
- Do not open `index.html` directly as a file; the game needs the local server for TikTok/WebSocket support.
- Refresh the OBS browser source cache, or remove and re-add the source.
- Settings set in Chrome do not automatically appear in OBS; configure the OBS copy or import a settings file.

### TikTok stays connected after closing the game tab

That is expected: the WebSocket lives on the server. Use **Disconnect** in the TikTok tab, or close the server window.

---

## Advanced: local API

The server exposes a small local JSON API (used by the game UI):

- `GET /api/status` — connection and library status.
- `POST /api/tiktok/connect` — `{ username, signApiKey?, sessionId?, ttTargetIdc? }`.
- `POST /api/tiktok/disconnect`.
- `POST /api/test` — inject a local test event, e.g. `{ "event": "gift", "data": { "giftName": "Rose", "repeatCount": 1, "user": { "nickname": "Test" } } }`.

WebSocket clients connect to `ws://localhost:3000/ws` for `status` and `event` messages. The `/api/test` route is local-only and handy for OBS/multi-window testing.

---

## Project layout

```
snake-mod-live/
  server.js              local HTTP + WebSocket server, TikTok bridge
  start.bat              Windows one-click launcher
  README.txt             plain-text quick start
  README.md              full guide
  package.json           scripts and dependencies
  node_modules/          bundled dependencies (no install required)
  public/
    index.html           app markup and menu
    css/style.css        responsive UI, themes, OBS mode
    js/app.js            UI wiring, settings import/export, OBS startup
    js/game.js           snake engine, effects, rendering, audio hooks
    js/tiktok.js         TikTok client, gift rules, feed, gift lab
    js/store.js          defaults, modes, themes, skins, actions, sanitizing
    js/audio.js          synthesized SFX and speech
```

---

## Privacy and caveats

- The server binds to `127.0.0.1`, so it is not exposed to your network or the internet.
- Settings and best score stay in browser storage. Nothing is uploaded by this app.
- When you connect TikTok, the server talks to TikTok and (if configured) the signing service. That traffic is required for the connection and is not controlled by this app.
- TikTok Live connection is unofficial and may change or stop working at any time.
- This is a fan project for personal/stream use; respect TikTok's terms and the rights of the original game's creators.
