@echo off
setlocal EnableExtensions
title Hospital HIS - startup launcher

REM Repository root = parent of scripts\windows
pushd "%~dp0..\.." || (
  echo [ERROR] Could not change to repository root.
  pause
  exit /b 1
)
set "REPO_ROOT=%CD%"
set "API_PORT=%PORT%"
if not defined API_PORT set "API_PORT=3000"
set "WEB_PORT=%WEB_PORT%"
if not defined WEB_PORT set "WEB_PORT=4200"

echo.
echo ============================================
echo   Hospital HIS - startup launcher
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

REM ---------- Resolve LAN URL ----------
set "LOCAL_IP="
for /f %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-local-ip.ps1"') do set "LOCAL_IP=%%i"
if defined LOCAL_IP set "LOCAL_IP=%LOCAL_IP: =%"
if not defined LOCAL_IP set "LOCAL_IP=localhost"
set "WEB_URL=http://%LOCAL_IP%:%WEB_PORT%/"
set "API_URL=http://127.0.0.1:%API_PORT%/api/trial/status"
echo   LAN URL: %WEB_URL%
echo.

REM ---------- Docker engine ----------
echo [1/5] Checking Docker engine...
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
echo [2/5] Starting PostgreSQL ^(docker compose up -d^)...
docker compose up -d
if errorlevel 1 (
  echo [ERROR] docker compose up failed.
  pause
  popd
  exit /b 1
)
echo       Waiting for database container...
timeout /t 8 /nobreak >nul

REM ---------- Database migrations ----------
echo [3/5] Checking migration status...
node "%REPO_ROOT%\scripts\run-migrations.mjs" --status
if errorlevel 1 (
  echo [ERROR] Failed to read migration status.
  echo         Fix database connectivity/configuration, then run again.
  pause
  popd
  exit /b 1
)

echo [3/5] Applying pending migrations...
node "%REPO_ROOT%\scripts\run-migrations.mjs" --apply
if errorlevel 1 (
  echo [ERROR] Failed to run database migrations.
  echo         Fix the migration error, then run this script again.
  pause
  popd
  exit /b 1
)

REM ---------- npm start in new window ----------
echo [4/5] Starting API + Web ^(npm start^) in a separate window...
REM Use PowerShell so paths with spaces work reliably.
start "Hospital HIS - npm start" powershell -NoExit -NoProfile -Command "Set-Location -LiteralPath '%REPO_ROOT%'; Write-Host ('Repository: ' + (Get-Location).Path); npm start"

REM ---------- Wait then open browser ----------
echo [5/5] Waiting for %API_URL% and %WEB_URL% ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0wait-dev-servers.ps1" -ApiUrl "%API_URL%" -WebUrl "%WEB_URL%"
if errorlevel 1 (
  echo [WARN] Servers did not respond in time. Opening browser anyway -- refresh if the page is empty.
)

start "" "%WEB_URL%"

echo.
echo ============================================
echo   Browser opened: %WEB_URL%
echo   LAN URL:        %WEB_URL%
echo   API:            http://%LOCAL_IP%:%API_PORT%/api
echo.
echo   Leave the "npm start" window open while you work.
echo   Close that window or press Ctrl+C there to stop servers.
echo   This launcher can be closed now.
echo ============================================
pause

popd
endlocal
