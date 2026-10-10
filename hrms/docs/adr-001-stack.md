# ADR 001 — Technology stack

**Status:** accepted

## Context

The HRMS brief recommends Java + Spring Boot for the backend. This build environment could not reach Maven Central, so a Spring Boot service could not be compiled or tested here, and the work would be unverified.

## Decision

Use a single **TypeScript** codebase: Next.js 15 (App Router) for UI and API routes, **Drizzle ORM** over **PostgreSQL 16**, **Zod** for validation, **jose** for JWT, and **Tailwind CSS 4** for styling.

The architecture keeps the same layering a Spring service would use (controller → service → repository, transactions, RBAC in services), so the design can be ported to Spring Boot later without changing the data model or API contracts.

## Consequences

* Full type-safety from database to UI (Drizzle types flow into services and components).
* One language and one toolchain for CI and Docker.
* The Spring Boot option stays open; the REST contract under `/api` is the seam.
