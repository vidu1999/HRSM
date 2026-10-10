import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { attendanceRecords, db, employees } from "@/db";
import { badRequest, conflict } from "../errors";
import { scopeFilter, visibleEmployeeIds } from "../rbac";
import type { Session } from "../session";
import { todayInAppZone } from "../workdays";
import { recordAudit } from "../audit";
import type { ClientInfo } from "../types";

function requireEmployee(session: Session): string {
  if (!session.employeeId) throw badRequest("Your account is not linked to an employee record");
  return session.employeeId;
}

export async function checkIn(session: Session, client: ClientInfo, now = new Date()) {
  const employeeId = requireEmployee(session);
  const workDate = todayInAppZone(now);

  return db.transaction(async (tx) => {
    // Lock the employee row so two concurrent check-ins can't both succeed.
    await tx.select({ id: employees.id }).from(employees).where(eq(employees.id, employeeId)).for("update");
    const [existing] = await tx
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.workDate, workDate)))
      .limit(1);
    if (existing?.checkIn) throw conflict("You have already checked in today");

    const [row] = existing
      ? await tx.update(attendanceRecords).set({ checkIn: now, updatedAt: now }).where(eq(attendanceRecords.id, existing.id)).returning()
      : await tx.insert(attendanceRecords).values({ employeeId, workDate, checkIn: now }).returning();

    await recordAudit(tx, session, client, {
      action: "ATTENDANCE_CHECK_IN",
      entityType: "attendance",
      entityId: row.id,
      newValue: { workDate, checkIn: now.toISOString() },
    });
    return row;
  });
}

export async function checkOut(session: Session, client: ClientInfo, now = new Date()) {
  const employeeId = requireEmployee(session);
  const workDate = todayInAppZone(now);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.workDate, workDate)))
      .for("update")
      .limit(1);
    if (!existing?.checkIn) throw conflict("You have not checked in today");
    if (existing.checkOut) throw conflict("You have already checked out today");

    const [row] = await tx
      .update(attendanceRecords)
      .set({ checkOut: now, updatedAt: now })
      .where(eq(attendanceRecords.id, existing.id))
      .returning();

    await recordAudit(tx, session, client, {
      action: "ATTENDANCE_CHECK_OUT",
      entityType: "attendance",
      entityId: row.id,
      newValue: { workDate, checkOut: now.toISOString() },
    });
    return row;
  });
}

export async function getTodayStatus(session: Session) {
  if (!session.employeeId) return { workDate: todayInAppZone(), checkIn: null, checkOut: null };
  const workDate = todayInAppZone();
  const [row] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.employeeId, session.employeeId), eq(attendanceRecords.workDate, workDate)))
    .limit(1);
  return { workDate, checkIn: row?.checkIn ?? null, checkOut: row?.checkOut ?? null };
}

export async function listAttendance(session: Session, from: string, to: string, limit = 100) {
  const scope = await visibleEmployeeIds(session);
  const conditions: SQL[] = [gte(attendanceRecords.workDate, from), lte(attendanceRecords.workDate, to)];
  const scoped = scopeFilter(attendanceRecords.employeeId, scope);
  if (scoped) conditions.push(scoped);

  return db
    .select({
      id: attendanceRecords.id,
      workDate: attendanceRecords.workDate,
      checkIn: attendanceRecords.checkIn,
      checkOut: attendanceRecords.checkOut,
      employeeId: employees.id,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeNumber: employees.employeeNumber,
      workedMinutes: sql<number | null>`case when ${attendanceRecords.checkOut} is not null then extract(epoch from (${attendanceRecords.checkOut} - ${attendanceRecords.checkIn}))::int / 60 else null end`,
    })
    .from(attendanceRecords)
    .innerJoin(employees, eq(employees.id, attendanceRecords.employeeId))
    .where(and(...conditions))
    .orderBy(desc(attendanceRecords.workDate), desc(attendanceRecords.checkIn))
    .limit(limit);
}


