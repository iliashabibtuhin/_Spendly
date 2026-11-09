# Spendly: handover guide

A step-by-step checklist for deploying Spendly on your own GitHub, Neon, Render and Vercel accounts. For details on any step, see the linked section of [README.md](README.md).

**What has and hasn't been tested.**
- Tested locally: the PostgreSQL migration, the seed script and 42 API checks passed against a local PostgreSQL server.
- **Not yet tested: deploying to Neon, Render and Vercel.** Treat steps 4–7 as a first deployment and verify each one with the check at the end of the step.

---

## What you should have received

- [ ] The project folder: `client/`, `server/`, `README.md`, `HANDOVER.md`, `.gitignore`, etc.

The following are **not** included, by design. You will create your own:
- `server/.env` and `client/.env`: real configuration and secrets. You will create these from the `.env.example` files.
- `node_modules/`, `client/dist/` and `server/src/generated/`: recreated by `npm install` and `npm run build`.
- `server/dev.db`: the old SQLite database with private data. Only needed for the optional import (step 8). If the previous developer sends it, receive it privately and never commit it.

If any of those files *were* included, delete them before step 3. If you received a `.env`, don't reuse its secrets.

## Step 1: Install the tools

- [ ] Node.js **24 LTS** (22.13 is the minimum): `node -v`
- [ ] Git: `git --version`
- [ ] Optional for local development: Docker, or a native PostgreSQL. You can also skip both and use `npx prisma dev` or a Neon branch.

## Step 2: Run it locally (recommended before deploying)

Details: [README → Local development](README.md#local-development).

- [ ] Start a local PostgreSQL. For example: `docker run -d --name spendly-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=spendly -p 5432:5432 postgres:17`
- [ ] Set up the server:
  ```bash
  cd server
  cp .env.example .env
  ```
  - Edit `.env`: set `DATABASE_URL` to your local database.
  - Edit `.env`: set `JWT_SECRET` to the output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] `npm install`
- [ ] `npx prisma migrate dev`
- [ ] Optional: `npm run db:seed` (demo login `demo@spendly.app` / `demo1234`)
- [ ] `npm run dev`, then check that http://localhost:4000/api/health shows `{"ok":true}`.
- [ ] In a second terminal: `cd client`, `cp .env.example .env`, `npm install`, `npm run dev`. Then open http://localhost:5173.
- [ ] Register, add a transaction, and check the dashboard.

## Step 3: Create your GitHub repository

Details: [README → GitHub repository](README.md#1-github-repository).

- [ ] Run these from the project root:
  ```bash
  git init
  git add .
  git status
  ```
- [ ] **Check the `git status` list.** There must be no `.env` (only `.env.example`), no `dev.db`, no `node_modules`, no `dist`, and no `server/src/generated`.
- [ ] `git commit -m "Initial import of Spendly"`
- [ ] Create an **empty** repo on GitHub (no README or .gitignore), then:
  ```bash
  git branch -M main
  git remote add origin <url>
  git push -u origin main
  ```

## Step 4: Create the Neon database

Details: [README → Neon](README.md#2-neon-database).

- [ ] Create a new Neon project. Region: close to your Render region, e.g. Singapore.
- [ ] Click **Connect**, turn **Connection pooling OFF**, and copy the connection string. It looks like `postgresql://USER:PASSWORD@ep-....neon.tech/neondb?sslmode=require`.
- [ ] Store it somewhere safe. It is your production `DATABASE_URL` and is a **secret**.
- [ ] Generate a **new** production `JWT_SECRET` (same command as in step 2) and store it safely too.

You don't need to create tables; Render does that in step 5.

## Step 5: Deploy the API on Render

Details: [README → Render](README.md#3-render-api).

- [ ] **New → Web Service**, connected to your GitHub repo, with these settings:

  | Setting | Value |
  |---|---|
  | Root Directory | `server` |
  | Build Command | `npm ci --include=dev && npm run db:deploy` |
  | Start Command | `npm start` |
  | Health Check Path | `/api/health` |

- [ ] Add these environment variables:

  | Key | Value |
  |---|---|
  | `DATABASE_URL` | Neon string from step 4 |
  | `JWT_SECRET` | New secret from step 4 |
  | `CLIENT_ORIGIN` | `http://localhost:5173` for now; you'll change it in step 7 |
  | `NODE_ENV` | `production` |
  | `NODE_VERSION` | `24` |

- [ ] Do **not** add `PORT`.
- [ ] Deploy. In the build log, look for `prisma migrate deploy` applying `20261105080708_init`.
- [ ] **Verify:** `https://<service>.onrender.com/api/health` returns `{"ok":true}`.
- [ ] Note the Render URL for step 6.

## Step 6: Deploy the web app on Vercel

Details: [README → Vercel](README.md#4-vercel-web-app).

- [ ] **Add New → Project**, importing the same repo, with these settings:

  | Setting | Value |
  |---|---|
  | Root Directory | `client` |
  | Framework Preset | Vite |
  | Build Command | `npm run build` |
  | Output Directory | `dist` |

- [ ] Add the environment variable `VITE_API_URL` = `https://<service>.onrender.com/api`: include `/api`, with no trailing slash.
- [ ] Deploy. If you add or change `VITE_API_URL` later, **redeploy**, because the value is baked in at build time.
- [ ] Note the production URL, e.g. `https://spendly.vercel.app`.

## Step 7: Connect them (CORS)

Details: [README → CORS](README.md#cors).

- [ ] In Render, set `CLIENT_ORIGIN` to the exact Vercel URL from step 6: `https://...`, with no path. Add custom domains separated by commas. Save, and let Render redeploy.
- [ ] **Verify in the browser, on the Vercel URL:**
  - [ ] Register a new account. The 12 default categories should appear on the Categories page.
  - [ ] Log out and log back in.
  - [ ] Add, edit and delete a transaction. The dashboard totals should update.
  - [ ] Search transactions using different upper/lower case.
  - [ ] Set a monthly budget and check the progress bar.
  - [ ] Reload the page while on `/transactions`. It must not show a 404.
  - [ ] DevTools console: no CORS errors.
  - [ ] Render logs: no errors.

If something fails, see [README → Troubleshooting](README.md#troubleshooting).

## Step 8 (optional): Demo account or old data

Do **at most one** of these, on the production database. Run the commands from `server/` on your own machine; in PowerShell use `$env:DATABASE_URL="..."` first.

- **Public demo account:**
  ```bash
  DATABASE_URL="<neon url>" npm run db:seed
  ```
  This creates `demo@spendly.app` / `demo1234`, a **publicly known password**.
- **Import the previous developer's SQLite data:**
  ```bash
  DATABASE_URL="<neon url>" npm run db:import-sqlite -- /path/to/dev.db
  ```
  - Requires the original `dev.db`, received privately.
  - Requires a database that is **empty** apart from the migrated tables: no registrations, no seed.
  - See [README → importing the old SQLite data](README.md#optional-importing-the-old-sqlite-data).

## Step 9: Housekeeping

- [ ] Delete any `.env` files or secrets you received from the previous developer.
- [ ] Make sure only you hold the production `DATABASE_URL` and `JWT_SECRET`.
- [ ] Optional: create a Neon `dev` branch for local work, so local testing never touches production data.
- [ ] Future schema changes: run `npx prisma migrate dev --name ...` locally, commit the migration, and push. Render applies it with `db:deploy`. Never run `migrate dev` or `migrate reset` against Neon production.
