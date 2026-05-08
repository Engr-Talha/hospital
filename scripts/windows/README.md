# Windows one-click launcher

## What it does

1. Checks **Docker**; if the engine is down, starts **Docker Desktop** (common install paths) and waits until `docker info` works.
2. Runs **`docker compose up -d`** from the repository root (PostgreSQL).
3. Shows migration status (**applied/pending**) and applies all pending SQL migrations from `scripts/migrations/`.
4. Opens a **new Command Prompt** window and runs **`npm start`** (API + Angular in parallel).
5. Waits until API/web respond, then opens the app in your browser using the machine LAN IP URL (for same-network access).

## Requirements

- **Docker Desktop for Windows** installed and WSL2 / Hyper-V as required by Docker.
- **Node.js LTS** and **npm** on your PATH (same as manual `npm start`).
- **PowerShell** (built into Windows) for the port-wait script.

## First-time: Desktop shortcut

From the **repository root** in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install-desktop-shortcut.ps1
```

That creates **`Hospital HIS.lnk`** on your Desktop pointing at `start-hospital.bat`.

## Run without shortcut

Double-click:

`scripts\windows\start-hospital.bat`

Or run it from any folder; it `pushd`s to the repo root automatically.

## Notes

- **Docker Desktop** must be allowed to start; the first launch after boot can take a few minutes.
- The **npm start** window must stay open while you use the app; close it to stop the dev servers.
- Postgres data persists in the Docker volume until you remove it with `docker compose down -v`.
