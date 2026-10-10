# HRMS — Enterprise Human Resource Management System

A responsive, database-backed HR workspace inspired by the supplied reference UI. It includes employee management, organization structure, attendance, leave approvals, payroll previews, recruitment, performance, documents, reporting, audit history and workspace settings.

## Run locally

The application lives in [`hrms/`](hrms/README.md) and uses Next.js, TypeScript and PostgreSQL.

```bash
cd hrms
npm ci
cp .env.example .env.local
npm run db:local                 # keep this terminal running (embedded PostgreSQL)
```

In another terminal, from `hrms/`:

```bash
npm run db:migrate
npm run db:seed                  # demo data; development only
npm run dev                      # http://localhost:3000
```

For Docker, run `docker compose up --build` from `hrms/`; the app applies migrations on startup. See the detailed [setup guide](hrms/README.md).

## Demo sign-in

All demo users use `Password123!`:

| Email | Role |
| --- | --- |
| `hr@hrms.example` | HR Administrator — full HR workspace |
| `admin@hrms.example` | Super Admin — full access and role management |
| `manager@hrms.example` | Manager — scoped team access and approvals |
| `employee@hrms.example` | Employee — personal HR workflows |

## Data and safety

- Employee, leave, attendance, payroll preview, recruiting, performance, document metadata, settings, notification and audit records are persisted in PostgreSQL through Drizzle ORM.
- RBAC and employee scope are enforced by server-side APIs, not by hidden buttons alone.
- Payroll is an illustrative gross-pay preview. It does not calculate statutory/tax deductions, generate a compliant payslip, or move money. Verify local requirements before production use.
- Document files are stored in the database in this demo and are limited to 2.5 MB per upload.
- Seed records and local secrets are for development only; do not use demo credentials in production.

## Main modules

Dashboard · Employees · Organization · Attendance · Leave · Payroll · Recruitment · Performance · Documents · Reports · Audit Logs · Settings

See [`hrms/README.md`](hrms/README.md) for architecture, APIs, database details, and tests.
