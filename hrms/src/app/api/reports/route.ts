import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { apiHandler } from "@/lib/http";
import { db, attendanceRecords, auditLogs, departments, employees, leaveRequests, leaveTypes, payrollItems, payrollPeriods } from "@/db";
import { assertCan, can, scopeFilter, visibleEmployeeIds } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { badRequest } from "@/lib/errors";
import { todayInAppZone } from "@/lib/workdays";

function csvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
function csv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvValue).join(",")).join("\r\n");
}

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  assertCan(session, "reports:read");
  const report = new URL(req.url).searchParams.get("type") ?? "employees";
  const scope = await visibleEmployeeIds(session);
  const today = todayInAppZone();
  let content = "";
  let filename = "hrms-report.csv";

  if (report === "employees") {
    const rows = await db.select({
      number: employees.employeeNumber,
      first: employees.firstName,
      last: employees.lastName,
      email: employees.email,
      department: departments.name,
      title: employees.jobTitle,
      status: employees.status,
      joined: employees.joinDate,
      salary: employees.baseSalaryLkr,
    }).from(employees).innerJoin(departments, eq(departments.id, employees.departmentId)).where(scopeFilter(employees.id, scope)).orderBy(asc(employees.employeeNumber));
    content = csv([
      ["Employee number", "First name", "Last name", "Email", "Department", "Job title", "Status", "Join date", ...(can(session, "salary:read") ? ["Base salary LKR"] : [])],
      ...rows.map((row) => [row.number, row.first, row.last, row.email, row.department, row.title, row.status, row.joined, ...(can(session, "salary:read") ? [row.salary] : [])]),
    ]);
    filename = "employees.csv";
  } else if (report === "attendance") {
    const rows = await db.select({ date: attendanceRecords.workDate, number: employees.employeeNumber, first: employees.firstName, last: employees.lastName, checkIn: attendanceRecords.checkIn, checkOut: attendanceRecords.checkOut }).from(attendanceRecords).innerJoin(employees, eq(employees.id, attendanceRecords.employeeId)).where(and(gte(attendanceRecords.workDate, `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`), scopeFilter(employees.id, scope))).orderBy(desc(attendanceRecords.workDate)).limit(5000);
    content = csv([["Work date", "Employee number", "Employee", "Check in", "Check out"], ...rows.map((row) => [row.date, row.number, `${row.first} ${row.last}`, row.checkIn?.toISOString() ?? "", row.checkOut?.toISOString() ?? ""])]);
    filename = "attendance.csv";
  } else if (report === "leave") {
    const rows = await db.select({ start: leaveRequests.startDate, end: leaveRequests.endDate, days: leaveRequests.days, status: leaveRequests.status, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`, number: employees.employeeNumber, type: leaveTypes.name }).from(leaveRequests).innerJoin(employees, eq(employees.id, leaveRequests.employeeId)).innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId)).where(scopeFilter(employees.id, scope)).orderBy(desc(leaveRequests.createdAt)).limit(5000);
    content = csv([["Employee number", "Employee", "Leave type", "Start date", "End date", "Working days", "Status"], ...rows.map((row) => [row.number, row.name, row.type, row.start, row.end, row.days, row.status])]);
    filename = "leave-requests.csv";
  } else if (report === "payroll") {
    assertCan(session, "payroll:read");
    const latest = await db.select().from(payrollPeriods).orderBy(desc(payrollPeriods.period)).limit(1);
    const period = latest[0];
    if (!period) throw badRequest("Generate a payroll period before exporting payroll data");
    const rows = await db.select({ number: employees.employeeNumber, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`, department: departments.name, base: payrollItems.baseLkr, allowances: payrollItems.allowanceLkr, overtime: payrollItems.overtimeLkr, deductions: payrollItems.deductionsLkr, net: payrollItems.netLkr }).from(payrollItems).innerJoin(employees, eq(employees.id, payrollItems.employeeId)).innerJoin(departments, eq(departments.id, employees.departmentId)).where(eq(payrollItems.payrollPeriodId, period.id)).orderBy(asc(employees.employeeNumber));
    content = csv([["Period", "Employee number", "Employee", "Department", "Base LKR", "Allowances LKR", "Overtime LKR", "Deductions LKR", "Net LKR"], ...rows.map((row) => [period.period, row.number, row.name, row.department, row.base, row.allowances, row.overtime, row.deductions, row.net])]);
    filename = `payroll-${period.period}.csv`;
  } else if (report === "audit") {
    assertCan(session, "audit:read");
    const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5000);
    content = csv([["Timestamp", "Actor", "Action", "Entity", "Entity ID", "Before", "After", "IP address"], ...rows.map((row) => [row.createdAt.toISOString(), row.actorEmail, row.action, row.entityType, row.entityId, JSON.stringify(row.oldValue), JSON.stringify(row.newValue), row.ipAddress])]);
    filename = "audit-logs.csv";
  } else {
    throw badRequest("Unknown report type");
  }

  return new Response(content, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" } });
});
