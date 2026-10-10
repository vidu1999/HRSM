# HRMS — Enterprise Human Resource Management System

A modern, database-backed HR platform: employee records, departments and reporting lines, a leave workflow with balances and approvals, attendance, role-based access control, an audit trail and an executive dashboard.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL 16 · Zod · JWT (jose) · bcrypt · Vitest · Docker · GitHub Actions

See [`docs/architecture.md`](docs/architecture.md) for the design and [`docs/adr-001-stack.md`](docs/adr-001-stack.md) for why this stack was chosen.

## Quick start (Docker)

```bash
cp .env.example .env            # optional: set AUTH_SECRET
docker compose up --build       # starts PostgreSQL + the app on http://localhost:3000
docker compose exec app node_modules/.bin/tsx src/db/seed.ts   # load demo data (dev only)
```

The app container runs migrations automatically on start (`docker-entrypoint.sh`).

## Quick start (local, no Docker)

```bash
npm install
npm run db:local                # embedded PostgreSQL on localhost:5432 (keep this running)
cp .env.example .env.local      # or export DATABASE_URL / AUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev                     # http://localhost:3000
```

Environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes at runtime | `postgres://user:pass@host:5432/db` |
| `AUTH_SECRET` | yes at runtime | ≥ 32 characters; signs session tokens |

## Demo accounts

Password for all accounts: `Password123!`

| Email | Role | What they can do |
| --- | --- | --- |
| `admin@hrms.example` | Super Admin | Everything, including audit logs and salaries |
| `hr@hrms.example` | HR Admin | All employees and salaries, create/deactivate staff, decide any leave |
| `manager@hrms.example` | Manager (Engineering) | Their team (direct and indirect reports), approve team leave |
| `employee@hrms.example` | Employee | Own profile, own leave, own attendance |

## Permission model

| Permission | Super Admin | HR Admin | Manager | Employee |
| --- | :-: | :-: | :-: | :-: |
| View employees | all | all | own team | self |
| View salaries | ✓ | ✓ | – | – |
| Create / update employees | ✓ | ✓ | – | – |
| Create leave | all | all | team | self |
| Approve / reject leave | ✓ | ✓ | team (not self) | – |
| Cancel leave | ✓ | ✓ | – | own pending |
| Check in / out | ✓ | ✓ | ✓ | ✓ |
| View audit logs | ✓ | ✓ | – | – |

Scope is enforced on the server (`src/lib/rbac.ts`). Hiding a button in the UI is never the only protection.

## Key workflows

* **Leave:** submit → the request reserves working days (weekends excluded) and must fit the remaining balance → a manager or HR approves (`SELECT … FOR UPDATE` on the balance) → balance is debited and the decision is audited. Overlapping requests and self-approval are rejected.
* **Attendance:** one check-in and one check-out per calendar day, in Asia/Colombo time.
* **Audit:** every write, login, and decision writes an append-only `audit_logs` row in the same transaction, with IP and user agent.

## API

All endpoints return JSON. Errors use `{ "error": string, "details": any }` with standard HTTP status codes.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in (sets `hrms_session` cookie) |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/employees` | List (paged, filterable, scoped) / create |
| GET / PATCH | `/api/employees/{id}` | Read / update |
| GET / POST | `/api/departments` | List with headcount / create |
| GET / POST | `/api/leave` | List (scoped) / submit request |
| GET | `/api/leave/balances?year=` | Balances for self (or an in-scope employee) |
| POST | `/api/leave/{id}/decision` | `{ "decision": "APPROVE" \| "REJECT", "note"? }` |
| POST | `/api/leave/{id}/cancel` | Cancel |
| GET / POST | `/api/attendance` | Range of records + today's status / `{ "action": "CHECK_IN" \| "CHECK_OUT" }` |
| GET | `/api/dashboard` | KPIs, trends, birthdays, recent leave |
| GET | `/api/audit` | Audit log (admins only) |

## Testing

```bash
npm run typecheck
npm test                # unit tests + integration tests against the real database
npm run build
```

* `tests/unit.test.ts`: RBAC matrix, working-day maths, birthdays, password and token handling, input validation.
* `tests/integration.test.ts`: leave workflow end to end (balances, overlap, self-approval, scope, concurrency), attendance rules, and audit entries. Requires a migrated and seeded database.

CI (`.github/workflows/hrms-ci.yml`) runs the same steps against a PostgreSQL service container.

## Project layout

```
hrms/
├── src/
│   ├── app/            # pages (App Router) and /api route handlers
│   ├── components/     # UI primitives and client-side forms/actions
│   ├── db/             # Drizzle schema, connection, migrate, seed
│   ├── lib/
│   │   ├── services/   # business logic: leave, attendance, employees, dashboard, audit
│   │   ├── rbac.ts     # permissions and scope
│   │   ├── session.ts  # cookie-backed session (server)
│   │   └── token.ts    # JWT helpers (edge-safe)
│   └── middleware.ts   # edge auth gate
├── drizzle/            # generated SQL migrations
├── tests/              # Vitest suites
├── scripts/            # local PostgreSQL helper for development
├── Dockerfile · docker-compose.yml · docker-entrypoint.sh
└── docs/               # architecture and ADRs
```

## Roadmap

Built: auth + RBAC, employees and departments, leave workflow with balances, attendance, dashboard, audit logs, Docker and CI.

Next: payroll (configurable components, payslips, approval and locking), recruitment (ATS pipeline), performance reviews, document storage, notifications via a queue, Redis caching and rate limiting, a public holiday calendar, and multi-tenancy.

## Notes

* The demo data (names, LKR salaries, leave allowances) is illustrative. Leave allowances and any payroll statutory rules must be confirmed against current Sri Lankan requirements before production use.
* The original static prototype remains in the repository root for reference.
