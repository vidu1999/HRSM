import { and, eq } from "drizzle-orm";
import { apiHandler } from "@/lib/http";
import { db, employees, payrollItems, payrollPeriods } from "@/db";
import { can } from "@/lib/rbac";
import { forbidden, notFound } from "@/lib/errors";
import { requireSession } from "@/lib/session";

function cell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export const GET = apiHandler(async (req: Request, context: { params: Promise<{ employeeId: string }> }) => {
  const session = await requireSession();
  const { employeeId } = await context.params;
  if (!can(session, "payroll:read") && session.employeeId !== employeeId) throw forbidden();
  const period = new URL(req.url).searchParams.get("period");
  const [row] = await db.select({
    period: payrollPeriods.period,
    employeeNumber: employees.employeeNumber,
    firstName: employees.firstName,
    lastName: employees.lastName,
    base: payrollItems.baseLkr,
    allowance: payrollItems.allowanceLkr,
    overtime: payrollItems.overtimeLkr,
    deductions: payrollItems.deductionsLkr,
    net: payrollItems.netLkr,
  }).from(payrollItems)
    .innerJoin(payrollPeriods, eq(payrollPeriods.id, payrollItems.payrollPeriodId))
    .innerJoin(employees, eq(employees.id, payrollItems.employeeId))
    .where(and(eq(payrollItems.employeeId, employeeId), ...(period ? [eq(payrollPeriods.period, period)] : [])))
    .limit(1);
  if (!row) throw notFound("Payslip");
  const content = [
    ["HRMS payslip preview", row.period],
    ["Employee", `${row.firstName} ${row.lastName}`],
    ["Employee number", row.employeeNumber],
    ["Base pay (LKR)", row.base],
    ["Allowances (LKR)", row.allowance],
    ["Overtime preview (LKR)", row.overtime],
    ["Deductions (LKR)", row.deductions],
    ["Gross/net preview (LKR)", row.net],
    ["Note", "Illustrative gross-pay preview only. Not a statutory payslip or payment instruction."],
  ].map((line) => line.map(cell).join(",")).join("\r\n");
  return new Response(content, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="payslip-${row.employeeNumber}-${row.period}.csv"`, "cache-control": "private, no-store" } });
});
