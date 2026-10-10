import { and, asc, count, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";
import { db, departments, employees, users } from "@/db";
import { recordAudit } from "../audit";
import { badRequest, conflict, notFound } from "../errors";
import { assertCan, assertCanAccessEmployee, can, scopeFilter, visibleEmployeeIds } from "../rbac";
import type { Session } from "../session";
import type { ClientInfo } from "../types";
import type { z } from "zod";
import type { employeeCreateSchema, employeeQuerySchema, employeeUpdateSchema } from "../validation";

type EmployeeCreate = z.infer<typeof employeeCreateSchema>;
type EmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
type EmployeeQuery = z.infer<typeof employeeQuerySchema>;

const publicColumns = {
  id: employees.id,
  employeeNumber: employees.employeeNumber,
  firstName: employees.firstName,
  lastName: employees.lastName,
  email: employees.email,
  phone: employees.phone,
  birthDate: employees.birthDate,
  jobTitle: employees.jobTitle,
  departmentId: employees.departmentId,
  departmentName: departments.name,
  managerId: employees.managerId,
  employmentType: employees.employmentType,
  status: employees.status,
  joinDate: employees.joinDate,
  baseSalaryLkr: employees.baseSalaryLkr,
};

/** Strips salary for roles that aren't allowed to see compensation data. */
function redact<T extends { baseSalaryLkr?: number }>(session: Session, row: T): T {
  if (can(session, "salary:read")) return row;
  const { baseSalaryLkr: _omit, ...rest } = row;
  return rest as T;
}

export async function listEmployees(session: Session, q: EmployeeQuery) {
  const scope = await visibleEmployeeIds(session);
  const conditions: SQL[] = [];
  const scoped = scopeFilter(employees.id, scope);
  if (scoped) conditions.push(scoped);
  if (q.departmentId) conditions.push(eq(employees.departmentId, q.departmentId));
  if (q.status) conditions.push(eq(employees.status, q.status));
  if (q.search) {
    const term = `%${q.search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(employees.firstName, term),
        ilike(employees.lastName, term),
        ilike(employees.email, term),
        ilike(employees.employeeNumber, term),
        ilike(employees.jobTitle, term),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(employees).where(where);
  const rows = await db
    .select(publicColumns)
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(where)
    .orderBy(asc(employees.firstName), asc(employees.lastName))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);

  return {
    data: rows.map((r) => redact(session, r)),
    page: q.page,
    pageSize: q.pageSize,
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(Number(total) / q.pageSize)),
  };
}

export async function getEmployee(session: Session, id: string) {
  await assertCanAccessEmployee(session, id);
  const [row] = await db
    .select(publicColumns)
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(eq(employees.id, id))
    .limit(1);
  if (!row) throw notFound("Employee");
  return redact(session, row);
}

async function nextEmployeeNumber(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]): Promise<string> {
  const [row] = await tx
    .select({
      next: sql<number>`coalesce(max(substring(${employees.employeeNumber} from 5)::int), 1000) + 1`,
    })
    .from(employees)
    .where(sql`${employees.employeeNumber} ~ '^EMP-[0-9]+$'`);
  return `EMP-${Number(row.next)}`;
}

export async function createEmployee(session: Session, client: ClientInfo, input: EmployeeCreate) {
  assertCan(session, "employees:write");

  return db.transaction(async (tx) => {
    const [dept] = await tx.select({ id: departments.id }).from(departments).where(eq(departments.id, input.departmentId)).limit(1);
    if (!dept) throw badRequest("Department does not exist");
    if (input.managerId) {
      const [mgr] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, input.managerId)).limit(1);
      if (!mgr) throw badRequest("Manager does not exist");
    }
    const employeeNumber = await nextEmployeeNumber(tx);
    const [created] = await tx
      .insert(employees)
      .values({
        ...input,
        employeeNumber,
        phone: input.phone || null,
        birthDate: input.birthDate || null,
        managerId: input.managerId || null,
        status: "ACTIVE",
      })
      .returning();

    await recordAudit(tx, session, client, {
      action: "EMPLOYEE_CREATED",
      entityType: "employee",
      entityId: created.id,
      newValue: { employeeNumber, email: created.email, departmentId: created.departmentId },
    });
    return getEmployeeFromTx(tx, session, created.id);
  });
}

async function getEmployeeFromTx(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], session: Session, id: string) {
  const [row] = await tx
    .select(publicColumns)
    .from(employees)
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(eq(employees.id, id))
    .limit(1);
  if (!row) throw notFound("Employee");
  return redact(session, row);
}

export async function updateEmployee(session: Session, client: ClientInfo, id: string, input: EmployeeUpdate) {
  assertCan(session, "employees:write");

  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(employees).where(eq(employees.id, id)).for("update").limit(1);
    if (!current) throw notFound("Employee");
    if (input.managerId === id) throw badRequest("An employee cannot be their own manager");
    if (input.managerId && (await isInReportingTree(tx, input.managerId, id))) {
      throw conflict("Manager assignment would create a reporting cycle");
    }
    if (input.email && input.email !== current.email) {
      const [clash] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.email, input.email)).limit(1);
      if (clash) throw conflict("Another employee already uses this email");
    }

    const patch: Partial<typeof employees.$inferInsert> = { updatedAt: new Date() };
    if (input.firstName !== undefined) patch.firstName = input.firstName;
    if (input.lastName !== undefined) patch.lastName = input.lastName;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone || null;
    if (input.birthDate !== undefined) patch.birthDate = input.birthDate || null;
    if (input.jobTitle !== undefined) patch.jobTitle = input.jobTitle;
    if (input.departmentId !== undefined) patch.departmentId = input.departmentId;
    if (input.managerId !== undefined) patch.managerId = input.managerId || null;
    if (input.employmentType !== undefined) patch.employmentType = input.employmentType;
    if (input.status !== undefined) patch.status = input.status;
    if (input.joinDate !== undefined) patch.joinDate = input.joinDate;
    if (input.baseSalaryLkr !== undefined) patch.baseSalaryLkr = input.baseSalaryLkr;

    await tx.update(employees).set(patch).where(eq(employees.id, id));

    // Keep the linked login's email in sync with the employee record.
    if (input.email !== undefined) {
      await tx.update(users).set({ email: input.email, updatedAt: new Date() }).where(eq(users.employeeId, id));
    }

    const oldValue = Object.fromEntries(Object.keys(patch).filter((k) => k !== "updatedAt").map((k) => [k, (current as Record<string, unknown>)[k]]));
    await recordAudit(tx, session, client, {
      action: "EMPLOYEE_UPDATED",
      entityType: "employee",
      entityId: id,
      oldValue: redactAudit(session, oldValue),
      newValue: redactAudit(session, { ...patch, updatedAt: undefined }),
    });
    return getEmployeeFromTx(tx, session, id);
  });
}

function redactAudit(session: Session, values: Record<string, unknown>) {
  if (can(session, "salary:read")) return values;
  const { baseSalaryLkr: _o, ...rest } = values;
  return rest;
}

/** Walks up from `candidateManagerId`; returns true if `employeeId` is found (would create a cycle). */
async function isInReportingTree(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], candidateManagerId: string, employeeId: string) {
  const rows = await tx.execute<{ id: string }>(sql`
    WITH RECURSIVE chain AS (
      SELECT id, manager_id FROM employees WHERE id = ${candidateManagerId}
      UNION
      SELECT e.id, e.manager_id FROM employees e JOIN chain c ON e.id = c.manager_id
    )
    SELECT id FROM chain WHERE id = ${employeeId}
  `);
  return rows.rows.length > 0;
}

export async function listDepartments() {
  return db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      headcount: sql<number>`(select count(*)::int from ${employees} e where e.department_id = ${departments.id} and e.status <> 'TERMINATED')`,
    })
    .from(departments)
    .orderBy(asc(departments.name));
}

export async function createDepartment(session: Session, client: ClientInfo, input: { name: string; code: string }) {
  assertCan(session, "departments:write");
  const [dup] = await db.select({ id: departments.id }).from(departments).where(eq(departments.code, input.code)).limit(1);
  if (dup) throw conflict("A department with this code already exists");
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(departments).values(input).returning();
    await recordAudit(tx, session, client, {
      action: "DEPARTMENT_CREATED",
      entityType: "department",
      entityId: row.id,
      newValue: input,
    });
    return row;
  });
}

/** Ensures the caller can read an employee before exposing related data. */
export async function assertEmployeeReadable(session: Session, employeeId: string) {
  await assertCanAccessEmployee(session, employeeId);
}

/** Lightweight "id + label" options for pickers, limited to the caller's scope. */
export async function listEmployeeOptions(session: Session, limit = 200) {
  const scope = await visibleEmployeeIds(session);
  const where = and(
    ne(employees.status, "TERMINATED"),
    scopeFilter(employees.id, scope),
  );
  const rows = await db
    .select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, employeeNumber: employees.employeeNumber })
    .from(employees)
    .where(where)
    .orderBy(asc(employees.firstName), asc(employees.lastName))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, label: `${r.firstName} ${r.lastName} (${r.employeeNumber})` }));
}
