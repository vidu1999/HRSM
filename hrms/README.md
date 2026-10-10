# HRMS — Enterprise Human Resource Management System

A modern, responsive HR platform inspired by the supplied HRMS dashboard reference. The UI is built with Next.js App Router and React Server Components; business data is read and written through server-side APIs backed by PostgreSQL.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL · Zod · JWT (`jose`) · bcrypt · Vitest · Docker

## Quick start (Docker)

```bash
cp .env.example .env            # set a private AUTH_SECRET for real deployments
docker compose up --build       # PostgreSQL + app on http://localhost:3000
docker compose exec app node_modules/.bin/tsx src/db/seed.ts  # demo data, development only
```

The app container applies migrations automatically on startup.

## Quick start (local, no Docker)

```bash
npm ci
npm run db:local                # keep running; embedded PostgreSQL listens on localhost:5432
cp .env.example .env.local      # or export DATABASE_URL and AUTH_SECRET
npm run db:migrate
npm run db:seed                 # development only
npm run dev                     # http://localhost:3000
```

Environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes at runtime | PostgreSQL connection string |
| `AUTH_SECRET` | yes at runtime | At least 32 characters; signs session tokens |

## Demo accounts

Password for all accounts: `Password123!`

| Email | Role | Access |
| --- | --- | --- |
| `admin@hrms.example` | Super Admin | All modules, role assignments, audit logs |
| `hr@hrms.example` | HR Admin | Organization-wide HR and payroll workflows |
| `manager@hrms.example` | Manager (Engineering) | Scoped team data, leave decisions, performance |
| `employee@hrms.example` | Employee | Personal attendance, leave, documents and performance |

## Modules

- **Dashboard:** live PostgreSQL KPIs, attendance trend, leave distribution, recent requests, birthdays and personal clock-in/out.
- **Employees:** searchable, filterable directory; pagination; employee creation and status management; CSV export.
- **Organization:** department headcounts, reporting directory, department creation and links into the filtered employee directory.
- **Attendance:** clock-in/out in Asia/Colombo time, date/search filters, summaries and CSV export.
- **Leave:** balances, working-day calculations, request submission, approval/rejection/cancellation, notifications and audit events.
- **Payroll:** salary structure, payroll periods, gross-pay previews, downloadable CSV payslips and export.
- **Recruitment:** job posts, candidate applications and a persisted application-stage pipeline.
- **Performance:** scoped goals, progress updates, review cycles, KPI summaries and feedback.
- **Documents:** searchable company and employee files; uploads are stored with metadata/content in PostgreSQL and can be downloaded or removed by authorized HR users.
- **Reports & Analytics:** department headcount, workforce metrics and database-generated CSV reports.
- **Audit Logs:** searchable, append-only HR/security history and CSV export.
- **Settings:** company preferences, security policy, notification preferences, system status, role definitions and access assignment.

Navigation search (⌘/Ctrl+K), notifications, profile/sign-out, filters, modals, downloads, responsive navigation, and module actions are interactive. Page and chart transitions honor `prefers-reduced-motion`.

## Database and permissions

Drizzle schema and migrations live in `src/db/schema.ts` and `drizzle/`. The original core schema holds users, departments, employees, leave, attendance and audit records. The enterprise-module migration adds payroll, recruiting, performance, documents, application settings and notifications.

| Permission | Super Admin | HR Admin | Manager | Employee |
| --- | :-: | :-: | :-: | :-: |
| View employees | all | all | own team | self |
| View payroll / salaries | ✓ | ✓ | – | own access only via scoped endpoint |
| Create / update employees | ✓ | ✓ | – | – |
| Create / decide leave | ✓ | ✓ | team | self request |
| Check in / out | ✓ | ✓ | ✓ | ✓ |
| Manage jobs | ✓ | ✓ | – | – |
| Read/write performance goals | all | all | team | self read |
| Manage documents/settings | ✓ | ✓ | – | – |
| Change roles | ✓ | – | – | – |
| View audit logs | ✓ | ✓ | – | – |

The backend is authoritative for access control. Salary columns are withheld from non-HR employee responses and reports. Manager/employee records are scoped to their reporting tree or own profile.

## Key workflows

- **Leave:** submit → reserve working days → manager/HR decision → update balance → notify employee → audit. Overlapping requests, self-approval and out-of-scope actions are rejected.
- **Attendance:** one check-in and one check-out per local calendar day, with Asia/Colombo date boundaries.
- **Recruitment:** job post → application → screening → interview → offer → hire/decline. Stage changes are persisted and audited.
- **Payroll:** create a period → snapshot active base salaries and sample components → save employee lines and totals → audit. This is deliberately a **gross-pay preview**, not a statutory calculation or payment instruction.
- **Documents:** authorized HR users upload a file (max 2.5 MB); content and metadata are stored in PostgreSQL; downloads are scoped and authenticated.
- **Notifications:** read state persists per user. Workflow decisions create in-app alerts.

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in and set the secure session cookie |
| GET / POST | `/api/employees` | Search/list or create employee records |
| GET / POST | `/api/departments` | List or create departments |
| GET / POST | `/api/leave` | List or submit requests |
| POST | `/api/leave/{id}/decision` | Approve or reject a request |
| GET / POST | `/api/attendance` | Read records or check in/out |
| GET / POST | `/api/payroll` | Read payroll summary or generate a safe preview |
| GET / POST / PATCH | `/api/recruitment` | Read hiring data, create jobs/applications, advance stages |
| GET / POST / PATCH | `/api/performance` | Read goals/reviews, create goals, update progress |
| GET / POST | `/api/documents` | List or upload database-backed documents |
| GET | `/api/reports?type=employees\|attendance\|leave\|payroll\|audit` | Download scoped CSV exports |
| GET / PATCH | `/api/settings` | Read or update workspace preferences |
| GET / PATCH | `/api/notifications` | Read or mark notifications as read |
| GET | `/api/search?q=...` | Search in-scope employees and accessible modules |

## Tests and quality checks

```bash
npm run typecheck
npm test                    # unit + PostgreSQL integration tests
npm run build
```

Integration tests require a migrated PostgreSQL database. The local database helper supports running them without Docker.

## Important production notes

- Seed data is illustrative, not real employee data. `db:seed` refuses to run in production unless `SEED_FORCE=1` is explicitly set.
- Payroll values and example balances are for demonstration only. Confirm applicable Sri Lankan statutory and tax rules with authoritative sources before production use.
- Configure a private `AUTH_SECRET`, HTTPS, database backups, rate limiting, and external object storage before handling real employee documents.
- Do not commit `.env` / `.env.local` or uploaded files.
