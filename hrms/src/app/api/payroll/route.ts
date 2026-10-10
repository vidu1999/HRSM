import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getPayrollSnapshot, runPayroll } from "@/lib/services/modules";

const payrollSchema = z.object({ period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/) });

export const GET = apiHandler(async () => {
  const session = await requireSession();
  assertCan(session, "payroll:read");
  return NextResponse.json(await getPayrollSnapshot());
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = payrollSchema.parse(await readJson(req));
  return NextResponse.json(await runPayroll(session, clientInfo(req), input.period), { status: 201 });
});
