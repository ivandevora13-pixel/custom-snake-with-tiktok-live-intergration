@echo off
setlocal EnableExtensions
title Snake Mod Live Launcher
cd /d "%~dp0"

rem --- Locate Node.js (PATH first, then common install folders) ---
set "NODE_EXE="
for %%I in (node.exe) do if not "%%~$PATH:I"=="" set "NODE_EXE=%%~$PATH:I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"

if not defined NODE_EXE (
  echo.
  echo Node.js was not found on this PC.
  echo Install Node.js 20 or newer from https://nodejs.org/
  echo then double-click start.bat again.
  echo.
  pause
  exit /b 1
)

rem --- Locate npm (PATH first, then next to node) ---
set "NPM_CMD="
for %%I in (npm.cmd) do if not "%%~$PATH:I"=="" set "NPM_CMD=%%~$PATH:I"
if not defined NPM_CMD for %%D in ("%NODE_EXE%") do if exist "%%~dpDnpm.cmd" set "NPM_CMD=%%~dpDnpm.cmd"

if not defined PORT set "PORT=3000"

rem --- Install dependencies if this is a source-only copy ---
set "NEED_INSTALL="
if not exist "node_modules\ws\package.json" set "NEED_INSTALL=1"
if not exist "node_modules\tiktok-live-connector\package.json" set "NEED_INSTALL=1"
if defined NEED_INSTALL (
  echo Installing dependencies. This needs internet and only happens once...
  if defined NPM_CMD (
    call "%NPM_CMD%" install
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo.
    echo Installation failed. Check your internet connection and run start.bat again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Starting Snake Mod Live on port %PORT%...
echo Close the "Snake Mod Live Server" window to stop it.
echo.

start "Snake Mod Live Server" cmd /k ""%NODE_EXE%" server.js"
rem Wait two seconds without relying on console input.
ping 127.0.0.1 -n 3 >nul
if not defined SNAKE_NO_BROWSER start "" "http://localhost:%PORT%/"
exit /b 0
