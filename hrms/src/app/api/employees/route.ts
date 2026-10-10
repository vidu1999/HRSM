import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { createEmployee, listEmployees } from "@/lib/services/employees";
import { employeeCreateSchema, employeeQuerySchema } from "@/lib/validation";

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const query = employeeQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(await listEmployees(session, query));
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  assertCan(session, "employees:write"); // authorise before validating the body
  const input = employeeCreateSchema.parse(await readJson(req));
  const created = await createEmployee(session, clientInfo(req), input);
  return NextResponse.json(created, { status: 201 });
});
