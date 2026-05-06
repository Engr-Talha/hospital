# Hospital monorepo (Nx + NestJS + Angular + PrimeNG)

Monorepo layout:

- `apps/api` — NestJS REST API (`/api` prefix), PostgreSQL + TypeORM, JWT auth, role-based access
- `apps/web` — Angular + PrimeNG SPA
- `libs/shared` — Shared TypeScript types (`@hospital/shared`)
- [`docker-compose.yml`](docker-compose.yml) — local **PostgreSQL** in Docker (recommended for development)

## Full setup from scratch (Docker + DB viewer + application)

Follow these steps on the machine where you develop (Docker and your database viewer are **separate installs**: Docker runs Postgres; DBeaver/pgAdmin is only a client to browse tables).

### 1. Install Docker

- **macOS / Windows:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it (whale icon should be running).
- **Linux:** install Docker Engine and the Compose plugin from your distribution or [Docker’s docs](https://docs.docker.com/engine/install/).

Confirm:

```bash
docker --version
docker compose version
```

### 2. (Optional) Install a database viewer

Use any PostgreSQL client you like; common choices:

- **[DBeaver](https://dbeaver.io/download/)** (Community edition is enough)
- **[pgAdmin](https://www.pgadmin.org/download/)**

Install it like a normal desktop app (not inside Docker). You only need this if you want to run SQL, inspect tables, or export data. The Hospital app does **not** require DBeaver to run.

### 3. Clone the repository and install Node dependencies

```bash
git clone <your-repo-url> Hospital
cd Hospital
npm install
```

**Prerequisites:** Node.js **LTS** (e.g. 20.x) and **npm** — [nodejs.org](https://nodejs.org/).

### 4. Configure environment variables

From the repo root:

```bash
cp .env.example .env
```

Edit [`.env`](.env) if needed. Defaults match [`docker-compose.yml`](docker-compose.yml):

| Variable   | Typical local value |
|------------|---------------------|
| `DB_HOST`  | `localhost`         |
| `DB_PORT`  | `5432`              |
| `DB_USER`  | `postgres`          |
| `DB_PASS`  | `postgres`          |
| `DB_NAME`  | `hospital`          |

For first-time local development, keep `TYPEORM_SYNC=true` so TypeORM creates tables when the API starts. Set a real `JWT_SECRET` before any shared or production deployment.

### 5. Start PostgreSQL with Docker Compose

From the **repository root** (same folder as `docker-compose.yml`):

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Wait until the `postgres` service is **healthy** (the compose file defines a `healthcheck`). If the API starts before Postgres is ready, you may see connection errors — wait a few seconds and restart the API.

**Data:** database files live in the Docker volume `hospital_pg` (managed by Docker). Removing the volume deletes all local DB data:

```bash
docker compose down -v
```

### 6. Connect your DB viewer (DBeaver example)

Create a **new PostgreSQL connection**:

- **Host:** `localhost`
- **Port:** `5432` (or whatever you set in `DB_PORT` / compose port mapping)
- **Database:** `hospital`
- **Username:** `postgres`
- **Password:** `postgres` (must match `POSTGRES_PASSWORD` in `docker-compose.yml` and `DB_PASS` in `.env`)

Test connection → you should see schemas and, after the API has run once with `TYPEORM_SYNC=true`, tables such as `users`, `patients`, etc.

### 7. Run the API and the web app

**Option A — one terminal (recommended):**

```bash
docker compose up -d
npm start
```

This runs `nx serve` for **api** and **web** together.

**Option B — two terminals:**

```bash
npm run start:api
```

```bash
npm run start:web
```

Then open the URL shown for the web app (usually **`http://localhost:4200`**). The dev server proxies `/api` to **`http://localhost:3000`**.

### 8. Sign in

Use the seeded accounts (created when the API starts against an empty `users` table):

| Role         | Email                      | Password   |
|--------------|----------------------------|------------|
| Admin        | `admin@hospital.local`     | `admin123` |
| Receptionist | `reception@hospital.local` | `recept123` |
| Lab          | `lab@hospital.local`       | `lab12345` |

Change passwords before any real deployment.

### 9. Stop services

- **Stop app:** `Ctrl+C` in the terminal running `npm start`.
- **Stop Postgres (keep data):** `docker compose stop`
- **Stop and remove containers (keep volume/data):** `docker compose down`

### Troubleshooting

- **`ECONNREFUSED` / login 500 / API won’t start:** Postgres is not running or not ready — run `docker compose up -d` and check `docker compose ps`.
- **Port 5432 already in use:** another PostgreSQL is bound to `5432`. Either stop it, or change the **left** side of the port mapping in `docker-compose.yml` (e.g. `'5433:5432'`) and set `DB_PORT=5433` in `.env`.
- **Nx / Docker “no such service” errors:** run **one command per line**; do not paste `# comments` on the same line as `docker compose` or `npm` commands.

---

## Configuration (quick reference)

1. Copy [`.env.example`](.env.example) to `.env` at the repo root (or edit the generated `.env`).
2. Ensure `DB_*` and `JWT_SECRET` are set. `TYPEORM_SYNC=true` auto-creates tables in development.

## Default logins (seeded on API startup)

| Role          | Email                     | Password   |
|---------------|---------------------------|------------|
| Admin         | `admin@hospital.local`    | `admin123` |
| Receptionist  | `reception@hospital.local`| `recept123` |
| Lab           | `lab@hospital.local`      | `lab12345` |

Change these before any production use.

## Run (after full setup)

Run **one command per line** (no inline `# comments` on the same line as `docker compose` or `npm`).

Ensure Postgres is up (`docker compose up -d`), then either:

```bash
npm start
```

or two terminals:

```bash
npm run start:api
```

```bash
npm run start:web
```

Open **`http://localhost:4200`** (typical). The dev proxy forwards `/api` to **`http://localhost:3000`**.

**Use a different address in the browser (not `localhost`):**

1. Pick a hostname, e.g. `his.local`.
2. Add a line to your machine’s hosts file (`/etc/hosts` on macOS/Linux): `127.0.0.1 his.local`
3. Start the dev server bound to all interfaces: `npm run start:web:lan` (or `nx serve web --host=0.0.0.0`).
4. Open `http://his.local:4200/` (same app; only the hostname in the bar changes). After login, the app sends each role to its own home (`/admin/dashboard`, `/reception/desk`, or `/lab`).

**Different port:** `nx serve web --port=4300` then use `http://localhost:4300/`.

**Change home routes:** edit [`apps/web/src/app/app.routes.ts`](apps/web/src/app/app.routes.ts) and [`apps/web/src/app/core/auth.service.ts`](apps/web/src/app/core/auth.service.ts) (`homePath()`).

### Using a domain name (not only localhost)

The app does not hardcode `localhost` in the UI. For a real hostname (for example `his.malgray.com` or `hospital.yourclinic.pk`):

1. **DNS** — Create an **A** (or **AAAA**) record pointing that hostname to your server’s public IP.
2. **HTTPS** — Terminate TLS on the server (e.g. **Nginx**, **Caddy**, or a cloud load balancer) with a certificate (Let’s Encrypt is typical).
3. **Serve the Angular build** — Deploy `dist/apps/web/browser` as static files for that host.
4. **API on the same host** — Prefer one origin: reverse-proxy `/api` to the Nest app (port 3000 internally). The SPA already calls relative URLs like `/api/...`, so no code change is needed if web and API share the same domain.
5. **API on another host** — You would add a production `environment` with an absolute API base URL and point `HttpClient` at it (not configured in this repo by default).

**Local dev:** To hit a remote API from `ng serve`, edit [`apps/web/proxy.conf.json`](apps/web/proxy.conf.json) and set `"target"` to that API base (including `https://` if applicable).

**Branding** (product name, Malgray credit, site, phone) is centralized in [`apps/web/src/app/core/branding.ts`](apps/web/src/app/core/branding.ts) for the shell, login, browser title, and printed slips.

## Features

- **Admin / Receptionist / Lab** login via JWT; each role receives a `permissions` list from the API (see `libs/shared/src/lib/permissions.ts`).
- **Register patient** (admin + receptionist); **delete patient** (admin only); **lab** can look up patients and the active fee catalog but not register patients, print slips, or manage charges.
- **Patient list** with search; **A4 registration slip** (`/patients/:id/print`, Life Care branding + logo)
- **Fee catalog (admin):** add/edit/deactivate services (X-ray, lab, radiology, etc.) under **Admin → Fee catalog** (`/admin/fee-catalog`). Default items are seeded on first empty catalog.
- **Per-patient charges:** on a patient’s detail page, **Add charge** from the price list or as a **custom** line; **Edit** (pencil) updates quantity, unit price, and description (description only for custom lines). **Fee slip (A4)** (`/patients/:id/fees-print`) and **Charges POS receipt** (`/patients/:id/fees-print-pos`, ~80mm thermal-style layout, separate from registration slip) list lines and total.
- **Dashboards:** **Admin** (`/admin/dashboard`) — full stats from `GET /api/dashboard/overview`. **Reception** (`/reception/desk`) — front-desk snapshot from `GET /api/dashboard/reception-desk`. **Lab** (`/lab`) — placeholder workspace from `GET /api/dashboard/lab-bench`. Legacy URL `/dashboard` redirects to `/admin/dashboard`.
- **Admin → Users** lists seeded staff (`GET /api/admin/users`)

### API (fees)

- `GET /api/fee-catalog` — active catalog (authenticated)
- `GET|POST|PATCH|DELETE /api/admin/fee-catalog` — full catalog management (admin)
- `GET|POST|PATCH|DELETE /api/patients/:patientId/fees` — list/add/update/remove charge lines (admin + receptionist). `PATCH …/fees/:lineId` accepts `quantity`, `unitPrice`, and optional `description` only when the line is **not** tied to a catalog item.

### API (dashboard)

- `GET /api/dashboard/overview` — full operations overview (**admin only**).
- `GET /api/dashboard/reception-desk` — reception snapshot (**receptionist only**).
- `GET /api/dashboard/lab-bench` — lab workspace placeholder (**lab only**).

## Build

```bash
npm run build
```

Outputs under `dist/apps/api` and `dist/apps/web`.

## On-premises at the hospital (LAN) — running the app without exposing your source code

Staff and browsers only need the **running application** and **database**. They do not need your Git repo, `apps/`, `libs/`, or `.ts` files.

### What you deploy vs what you keep private

| Keep on **your** machine (or secure dev/CI) | Put on the **hospital server** only |
|---------------------------------------------|--------------------------------------|
| Full monorepo, Git history, IDE             | Production **build output** + config |
| `apps/web/src`, `apps/api/src`, `libs/`     | `dist/apps/web/browser/` (static site) |
|                                             | `dist/apps/api/` (compiled Node API) + `node_modules` from `npm ci` in that folder |
|                                             | PostgreSQL data directory (or Docker volume) |

- **Angular:** `npm run build` uses the **production** configuration: minified bundles, **no source maps** in output (see `sourceMap` in [`apps/web/project.json`](apps/web/project.json)). The browser downloads JavaScript that is hard to read and is **not** your original TypeScript project layout.
- **Nest API:** Production webpack builds with **source maps disabled** (see [`apps/api/webpack.config.js`](apps/api/webpack.config.js)) so `.map` files are not shipped; only compiled JS runs on the server.

Anyone with server disk access could still open the compiled `.js` files (minified/obfuscated logic), but that is **not** the same as handing them your full source tree, tests, and history. True protection of intellectual property is legal + access control + building on a machine they never see.

### Suggested on-site architecture

1. **One PC or small server** on the hospital LAN (Windows or Linux) with **Node.js LTS** and **PostgreSQL** (or PostgreSQL in Docker on that same machine only).
2. On **your** office machine: clone the repo, set production `.env` (`JWT_SECRET`, strong DB password, **`TYPEORM_SYNC=false`** after first migration — do not rely on auto-sync in production), run `npm run build`.
3. Copy to the hospital machine **only**:
   - `dist/apps/web/browser/` (entire folder),
   - `dist/apps/api/` (main.js, assets, generated `package.json`),
   - install production deps: `cd dist/apps/api && npm ci` (or `npm install --omit=dev` per your lockfile workflow),
   - `.env` (secrets — not committed to Git).
4. **Run the API:** `node main.js` (or use **PM2** / **Windows Service** / systemd so it restarts on reboot).
5. **Serve the SPA:** **Nginx** or **IIS** (or `nx run web:serve-static` is fine for a small LAN) pointing document root at `dist/apps/web/browser`, with `try_files` / URL rewrite so Angular routes work, and **reverse-proxy `/api`** to `http://127.0.0.1:3000` so the browser never needs a separate API hostname.
6. **Reception PCs:** only a browser bookmark to `http://hospital-server` or `https://his.local` — no Node, no repo, no source.

### So “no one can check my code” means in practice

- **Do not** install Git or copy the monorepo onto shared reception computers.
- **Do not** run `npm start` / `ng serve` on the hospital floor (those are dev servers and are not how you ship).
- **Do** use OS **user accounts** and **firewall** rules so only IT/admin can log into the server; reception users only get the website.
- **HTTPS on LAN** is optional but recommended if you issue a local CA or use a split-DNS cert; at minimum restrict the admin/API port to localhost (proxy only).

If you need **schema migrations** without `TYPEORM_SYNC`, add a proper migration workflow later; until then, first deploy can use sync once to create tables, then turn sync off and redeploy.
