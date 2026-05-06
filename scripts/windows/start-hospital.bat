@echo off
setlocal EnableExtensions
title Hospital HIS - launcher

REM Repository root = parent of scripts\windows
pushd "%~dp0..\.." || (
  echo [ERROR] Could not change to repository root.
  pause
  exit /b 1
)
set "REPO_ROOT=%CD%"

echo.
echo ============================================
echo   Hospital HIS - local dev launcher
echo ============================================
echo   Folder: %REPO_ROOT%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not in PATH. Install Node LTS and reopen this window.
  pause
  popd
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not in PATH.
  pause
  popd
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI not found. Install Docker Desktop for Windows.
  pause
  popd
  exit /b 1
)

REM ---------- Docker engine ----------
echo [1/4] Checking Docker engine...
docker info >nul 2>&1
if not errorlevel 1 goto :docker_ready

echo       Docker is not running. Starting Docker Desktop...
set "DOCKER_EXE="
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if exist "%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=%ProgramFiles(x86)%\Docker\Docker\Docker Desktop.exe"
if exist "%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe" set "DOCKER_EXE=%LocalAppData%\Programs\Docker\Docker\Docker Desktop.exe"

if not defined DOCKER_EXE (
  echo [ERROR] Docker Desktop executable not found in usual locations.
  echo         Start Docker Desktop manually, then run this script again.
  pause
  popd
  exit /b 1
)

start "" "%DOCKER_EXE%"
echo       Waiting for Docker to accept commands ^(can take 1--3 minutes on first start^)...
set /a DOCKER_WAIT=0
:wait_docker
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if not errorlevel 1 goto :docker_ready
set /a DOCKER_WAIT+=1
if %DOCKER_WAIT% GEQ 72 (
  echo [ERROR] Docker did not become ready in time ^(6 minutes^).
  pause
  popd
  exit /b 1
)
goto :wait_docker

:docker_ready
echo       Docker is OK.

REM ---------- Postgres ----------
echo [2/4] Starting PostgreSQL ^(docker compose up -d^)...
docker compose up -d
if errorlevel 1 (
  echo [ERROR] docker compose up failed.
  pause
  popd
  exit /b 1
)
echo       Waiting for database container...
timeout /t 8 /nobreak >nul

REM ---------- npm start in new window ----------
echo [3/4] Starting API + Web ^(npm start^) in a separate window...
REM Use PowerShell so paths with spaces work reliably.
start "Hospital HIS - npm start" powershell -NoExit -NoProfile -Command "Set-Location -LiteralPath '%REPO_ROOT%'; Write-Host ('Repository: ' + (Get-Location).Path); npm start"

REM ---------- Wait then open browser ----------
echo [4/4] Waiting for http://localhost:3000 and :4200 ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0wait-dev-servers.ps1"
if errorlevel 1 (
  echo [WARN] Servers did not respond in time. Opening browser anyway -- refresh if the page is empty.
)

start "" "http://localhost:4200/"

echo.
echo ============================================
echo   Browser opened: http://localhost:4200/
echo   API:            http://localhost:3000/api
echo.
echo   Leave the "npm start" window open while you work.
echo   Close that window or press Ctrl+C there to stop servers.
echo   This launcher can be closed now.
echo ============================================
pause

popd
endlocal
