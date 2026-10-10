import { and, count, countDistinct, desc, eq, gte, inArray, isNotNull, lte, ne } from "drizzle-orm";
import { attendanceRecords, db, departments, employees, leaveRequests, leaveTypes } from "@/db";
import { scopeFilter, visibleEmployeeIds } from "../rbac";
import type { Column } from "drizzle-orm";
import type { Session } from "../session";
import { listLeaveRequests } from "./leave";
import { isoDateAddDays, todayInAppZone } from "../workdays";

export async function getDashboard(session: Session) {
  const scope = await visibleEmployeeIds(session);
  const scoped = (col: Column) => scopeFilter(col, scope);
  const today = todayInAppZone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekStart = isoDateAddDays(today, -6);

  const [activeRow] = await db
    .select({ n: count() })
    .from(employees)
    .where(and(ne(employees.status, "TERMINATED"), scoped(employees.id)));

  const [onLeaveRow] = await db
    .select({ n: countDistinct(leaveRequests.employeeId) })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.status, "APPROVED"),
        lte(leaveRequests.startDate, today),
        gte(leaveRequests.endDate, today),
        scoped(leaveRequests.employeeId),
      ),
    );

  const [pendingRow] = await db
    .select({ n: count() })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.status, "PENDING"), scoped(leaveRequests.employeeId)));

  const [hiresRow] = await db
    .select({ n: count() })
    .from(employees)
    .where(and(gte(employees.joinDate, monthStart), lte(employees.joinDate, today), scoped(employees.id)));

  const leaveByType = await db
    .select({ code: leaveTypes.code, name: leaveTypes.name, n: count() })
    .from(leaveRequests)
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .where(
      and(
        gte(leaveRequests.startDate, monthStart),
        inArray(leaveRequests.status, ["PENDING", "APPROVED"]),
        scoped(leaveRequests.employeeId),
      ),
    )
    .groupBy(leaveTypes.code, leaveTypes.name)
    .orderBy(desc(count()));

  const attendanceTrend = await db
    .select({
      day: attendanceRecords.workDate,
      present: countDistinct(attendanceRecords.employeeId),
    })
    .from(attendanceRecords)
    .where(
      and(
        gte(attendanceRecords.workDate, weekStart),
        lte(attendanceRecords.workDate, today),
        isNotNull(attendanceRecords.checkIn),
        scoped(attendanceRecords.employeeId),
      ),
    )
    .groupBy(attendanceRecords.workDate)
    .orderBy(attendanceRecords.workDate);

  const [depts] = await db.select({ n: count() }).from(departments);

  const birthdayRows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      birthDate: employees.birthDate,
      departmentName: departments.name,
    })
    .from(employees)
    .innerJoin(departments, eq(departments.id, employees.departmentId))
    .where(and(isNotNull(employees.birthDate), ne(employees.status, "TERMINATED"), scoped(employees.id)));

  const recentLeave = await listLeaveRequests(session, { limit: 6, offset: 0 });

  return {
    today,
    kpis: {
      activeEmployees: Number(activeRow.n),
      onLeaveToday: Number(onLeaveRow.n),
      pendingApprovals: Number(pendingRow.n),
      newHiresThisMonth: Number(hiresRow.n),
      departments: Number(depts.n),
    },
    leaveByType: leaveByType.map((r) => ({ code: r.code, name: r.name, count: Number(r.n) })),
    attendanceTrend: attendanceTrend.map((r) => ({ day: r.day, present: Number(r.present) })),
    upcomingBirthdays: upcomingBirthdays(birthdayRows, today, 30).slice(0, 6),
    recentLeave,
  };
}

/** Birthdays in the next `days` days (inclusive of today), soonest first. */
export function upcomingBirthdays<T extends { birthDate: string | null }>(rows: T[], today: string, days: number) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  const result: (T & { nextOccurrence: string; daysAway: number })[] = [];
  for (const row of rows) {
    if (!row.birthDate) continue;
    const mmdd = row.birthDate.slice(5);
    let year = todayDate.getUTCFullYear();
    let next = new Date(`${year}-${mmdd}T00:00:00Z`);
    if (next < todayDate) {
      year += 1;
      next = new Date(`${year}-${mmdd}T00:00:00Z`);
    }
    const daysAway = Math.round((next.getTime() - todayDate.getTime()) / 86_400_000);
    if (daysAway <= days) result.push({ ...row, nextOccurrence: next.toISOString().slice(0, 10), daysAway });
  }
  return result.sort((a, b) => a.daysAway - b.daysAway);
}


