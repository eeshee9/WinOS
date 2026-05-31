# WinOS

Internal team operations platform for Eagle Eye Digital.

WinOS replaces informal standup channels and end-of-day check-ins with a structured workflow. Every team member submits a morning standup (DSM) and an evening status review (DSR). Managers review submissions, set task priorities, track blockers, and coordinate support.

## Features

- **DSM — Daily Standup** — yesterday/today task lists, blockers, and support-needed items per team member
- **DSR — Daily Status Review** — end-of-day completion tracking, sentiment, reflection, and manager review
- **Notes** — personal rich-text and checklist notes organised into notebooks with tags
- **Blockers & Support** — team-visible blocker log and support-needed tracker with resolution tracking
- **Notifications** — in-app DSM reminders sent from managers to team members

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, SSR) |
| UI | React 19, Tailwind CSS v4 |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Auth.js v5 (`next-auth@5`) — passwordless OTP, JWT sessions |
| Email | Nodemailer, Zoho SMTP |
| Testing | Vitest |
| CI | GitHub Actions |
| Deployment | AWS Amplify Hosting (SSR compute) |

Authentication is passwordless. Users receive a 6-digit OTP via email and must have a pre-provisioned `@eagleeyedigital.io` account in the database. There are two roles: `TEAM_MEMBER` and `MANAGER`.

## Local Development

**Prerequisites:** Node.js 20, npm, Docker (used by the Prisma local dev server for Postgres)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template and fill in local values
cp .env.example .env

# 3. Start the local Postgres dev server
npm run db:restart

# 4. Apply schema and generate Prisma client
npx prisma db push
npx prisma generate

# 5. Seed the database with initial users
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

When `SMTP_HOST` is not set, OTP codes are printed to the server console instead of being emailed — no SMTP configuration is needed to test login locally.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:restart` | Stop and restart the Prisma local Postgres server |
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:inspect` | Print a debug summary of the local database |
| `npm run db:schema` | Push schema changes, regenerate client, and clear `.next` cache |

## Environment Variables

Copy `.env.example` to `.env`. See that file for descriptions of each variable.

| Variable | Where required | Notes |
|---|---|---|
| `DATABASE_URL` | Dev + CI + Prod | PostgreSQL connection string |
| `SHADOW_DATABASE_URL` | Dev only | Shadow DB for `prisma migrate dev` |
| `AUTH_SECRET` | Dev + CI + Prod | Auth.js JWT secret — `openssl rand -base64 32` |
| `SMTP_HOST` | Prod only | e.g. `smtp.zoho.in` |
| `SMTP_PORT` | Prod only | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | Prod only | SMTP login address |
| `SMTP_PASS` | Prod only | Zoho app-specific password |
| `SMTP_FROM` | Prod only | From address — defaults to `WinOS <noreply@eagleeyedigital.io>` |

## CI

GitHub Actions runs on every push and pull request to `main`:

```
prisma generate → lint → test → build
```

Required GitHub repository secrets: `DATABASE_URL`, `AUTH_SECRET`.

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Deployment

Deployed on **AWS Amplify Hosting** with SSR compute. The build spec is in [`amplify.yml`](amplify.yml) at the repo root. Amplify auto-deploys from the `main` branch.

All production environment variables (database, auth, SMTP) are set in the Amplify console — not stored in this repository. The `amplify.yml` build spec writes them into `.env.production` before `next build` runs.

> Production AWS, database, and SMTP credentials are configured separately and are not part of this repository.
