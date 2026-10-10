import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { createDepartment, listDepartments } from "@/lib/services/employees";
import { departmentCreateSchema } from "@/lib/validation";

export const GET = apiHandler(async () => {
  await requireSession();
  return NextResponse.json({ data: await listDepartments() });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  assertCan(session, "departments:write");
  const input = departmentCreateSchema.parse(await readJson(req));
  return NextResponse.json(await createDepartment(session, clientInfo(req), input), { status: 201 });
});
