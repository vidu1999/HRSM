import { inArray, sql, type Column, type SQL } from "drizzle-orm";
import { db } from "@/db";
import type { Role } from "@/db/schema";
import type { Session } from "./session";
import { forbidden } from "./errors";

/**
 * Role model:
 *  SUPER_ADMIN  – everything, including audit logs and salaries
 *  HR_ADMIN     – all employees, leave, attendance, salaries; manages employee records
 *  MANAGER      – self + everyone reporting to them (recursively)
 *  EMPLOYEE     – self only
 */
export const PERMISSIONS = {
  "employees:read": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "employees:write": ["SUPER_ADMIN", "HR_ADMIN"],
  "salary:read": ["SUPER_ADMIN", "HR_ADMIN"],
  "leave:create": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "leave:decide": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
  "attendance:write-self": ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  "audit:read": ["SUPER_ADMIN", "HR_ADMIN"],
  "departments:write": ["SUPER_ADMIN", "HR_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(session: Session, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(session.role);
}

export function assertCan(session: Session, permission: Permission): void {
  if (!can(session, permission)) throw forbidden();
}

/** Roles with organisation-wide visibility. */
export function hasOrgScope(session: Session): boolean {
  return session.role === "SUPER_ADMIN" || session.role === "HR_ADMIN";
}

/**
 * Returns the employee ids the session may read, or `null` meaning "all employees".
 * Managers see their full reporting tree via a recursive CTE.
 */
export async function visibleEmployeeIds(session: Session): Promise<string[] | null> {
  if (hasOrgScope(session)) return null;
  if (!session.employeeId) return [];
  if (session.role !== "MANAGER") return [session.employeeId];

  const rows = await db.execute<{ id: string }>(sql`
    WITH RECURSIVE tree AS (
      SELECT id FROM employees WHERE id = ${session.employeeId}
      UNION
      SELECT e.id FROM employees e JOIN tree t ON e.manager_id = t.id
    )
    SELECT id FROM tree
  `);
  return rows.rows.map((r) => r.id);
}

/** True if `session` may act on data belonging to `employeeId` (self or in scope). */
export async function canAccessEmployee(session: Session, employeeId: string): Promise<boolean> {
  const scope = await visibleEmployeeIds(session);
  return scope === null || scope.includes(employeeId);
}

export async function assertCanAccessEmployee(session: Session, employeeId: string): Promise<void> {
  if (!(await canAccessEmployee(session, employeeId))) throw forbidden("Employee is outside your scope");
}

/** Helper for Drizzle `where` clauses: undefined when unrestricted. */
export function scopeFilter(column: Column, ids: string[] | null): SQL | undefined {
  if (ids === null) return undefined;
  if (ids.length === 0) return sql`false`;
  return inArray(column, ids);
}
