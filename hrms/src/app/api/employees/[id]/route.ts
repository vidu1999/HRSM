import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { getEmployee, updateEmployee } from "@/lib/services/employees";
import { employeeUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  return NextResponse.json(await getEmployee(session, id));
});

export const PATCH = apiHandler(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const input = employeeUpdateSchema.parse(await readJson(req));
  return NextResponse.json(await updateEmployee(session, clientInfo(req), id, input));
});
