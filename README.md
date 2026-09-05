# School SaaS

A multi-tenant School Management SaaS for Pakistani private schools — attendance, fees, and
automated WhatsApp parent notifications, replacing legacy on-prem ERPs like DeltaSoft.

The full product spec (why, what, architecture, database, roadmap) lives in
[`MVP-Development-Plan.md`](./MVP-Development-Plan.md). Read that first for the "why" behind any
decision in this codebase — this README only covers "how do I get it running."

**Current status:** Phase 0 (setup) and the auth slice of Phase 1 are done. Login, JWT
auth, and the role-based dashboard shell work end-to-end. Students/Attendance/Fees/
Communication/Settings are nav links only — their pages aren't built yet. See Section 16
of the plan for the full phase breakdown.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | Custom JWT (access + httpOnly refresh cookie) + bcrypt |
| Server state | TanStack Query |
| Client state | Zustand |

## Repo layout

```
apps/
  web/     Next.js frontend (port 3000)
  api/     Express backend + Prisma schema (port 4000)
```

## Prerequisites

- **Node.js 22+** and **npm 11+** (`node --version`, `npm --version`)
- **Git**
- **A PostgreSQL database.** Easiest options for local dev:
  - [Supabase](https://supabase.com) (free tier) — see the gotcha below
  - [Neon](https://neon.tech) (free tier, no IPv4 gotcha)
  - A local Postgres install

  > **Supabase users:** grab the **pooled** connection string (Project Settings → Database →
  > Connection string → "Connection pooling", Session mode), not the direct one. Supabase's
  > direct host is IPv6-only on the free tier and will fail to connect (`P1001`) on most
  > home/office networks. Details and the exact fix are in `apps/api/.env.example`.

## First-time setup

1. **Clone and install dependencies** (this installs both `apps/web` and `apps/api` via npm
   workspaces — run it once from the repo root):

   ```bash
   git clone <repo-url>
   cd SchoolSaas
   npm install
   ```

   If npm stops with a warning about pending install scripts (`allow-scripts`), run:

   ```bash
   npm approve-scripts --allow-scripts-pending
   npm install
   ```

2. **Configure the backend environment.** Copy the example file and fill in your own values:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Edit `apps/api/.env`:
   - `DATABASE_URL` — your Postgres connection string (see the Supabase note above).
   - `JWT_SECRET` / `JWT_REFRESH_SECRET` — generate your own random values, don't reuse the
     placeholders:

     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```

     Run it twice, once for each secret.

3. **Configure the frontend environment:**

   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```

   The default (`http://localhost:4000/api/v1`) is correct for local dev — no edits needed
   unless your API runs somewhere else.

4. **Run the database migration** (creates all tables from `apps/api/prisma/schema.prisma`):

   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

5. **Seed demo data** (creates one demo school + a School Admin login):

   ```bash
   npx tsx prisma/seed.ts
   ```

   This creates the login `admin@greenwood.test` / `password123`.

## Running the app

From the repo root, in two separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Then open **http://localhost:3000** and log in with the seeded demo account above.

## Useful scripts

Run from the repo root unless noted:

| Command | What it does |
|---|---|
| `npm run dev:api` | Start the Express API in watch mode (port 4000) |
| `npm run dev:web` | Start the Next.js dev server (port 3000) |
| `npm run build:api` | Compile the API to `apps/api/dist` |
| `npm run build:web` | Production build of the frontend |
| `npm run typecheck` | Typecheck both apps |

Inside `apps/api`:

| Command | What it does |
|---|---|
| `npx prisma studio` | Browse/edit the database in a GUI |
| `npx prisma migrate dev --name <desc>` | Create + apply a new migration after editing `schema.prisma` |
| `npx tsx prisma/seed.ts` | Re-run the seed script (safe to re-run — it upserts) |

## Contributing notes

- **Never commit `.env` or `.env.local`** — they're already gitignored. Each contributor sets
  up their own database and secrets locally.
- Prefer small, focused commits. When you change `prisma/schema.prisma`, always commit the
  generated migration folder under `prisma/migrations/` alongside it.
- The plan document (`MVP-Development-Plan.md`) is the source of truth for scope, data model,
  and the module-by-module roadmap — check it before adding a feature that isn't listed, or
  before reaching for a pattern (e.g. multi-tenancy, WhatsApp integration) that the plan
  already made a decision about.
