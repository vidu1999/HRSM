# HRMS architecture

## Overview

```
Browser ──► Next.js (App Router, TypeScript)
              │  Server Components  → services (direct DB reads)
              │  Route Handlers     → /api/* (JSON, validated with Zod)
              │  Middleware         → edge JWT check, redirects anonymous users
              ▼
          Service layer  (src/lib/services)
              │  business rules, transactions, audit entries
              ▼
          Drizzle ORM ──► PostgreSQL 16
```

## Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| UI | `src/app`, `src/components` | Pages (server-rendered) and small client islands for forms/actions |
| HTTP | `src/app/api/**/route.ts` | Parse + validate input, call services, map errors (`apiHandler`) |
| Domain / services | `src/lib/services/*` | Leave workflow, attendance, employees, dashboard, audit queries |
| Authorisation | `src/lib/rbac.ts` | Permission matrix and tree-based data scoping |
| Persistence | `src/db/*` | Drizzle schema, migrations (`drizzle/`), seed data |

## Security model

* **Authentication:** bcrypt (cost 12) password hashes; HS256 JWT in an `httpOnly`, `sameSite=lax` cookie (8 h TTL).
* **Session re-validation:** every request re-reads the user from PostgreSQL, so deactivating a user revokes access immediately and roles always come from the database.
* **Authorisation:** enforced in services, not only in the UI. Managers see their full reporting tree (recursive CTE); employees see only themselves.
* **Least exposure:** salaries are removed from responses for roles without `salary:read`.
* **Workflow integrity:** no self-approval; decisions use `SELECT … FOR UPDATE` so balances can't be double-debited under concurrency.
* **Audit:** every state change writes an `audit_logs` row in the same transaction, including IP and user agent.

## Leave workflow

```
PENDING ──approve (manager/HR, not self, in scope)──► APPROVED  (balance.used += days)
   │                                                     │
   ├──reject──► REJECTED                                 └──cancel by HR before start──► CANCELLED (balance restored)
   └──cancel by owner/HR──► CANCELLED
```

Working days exclude weekends. Pending requests reserve balance so employees can't over-apply.

## Known gaps / next steps

* Public holiday calendar (currently weekends only).
* Payroll, recruitment, performance and document modules.
* Redis (rate limiting for login, caching of dashboard aggregates) and a message queue for notifications.
* Multi-tenancy (`tenant_id` on every table) and MFA.
