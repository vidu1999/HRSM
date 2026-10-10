import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/lib/http";
import { assertCanAccessEmployee } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getBalances } from "@/lib/services/leave";
import { badRequest } from "@/lib/errors";

const query = z.object({
  employeeId: z.uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const q = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const employeeId = q.employeeId ?? session.employeeId;
  if (!employeeId) throw badRequest("No employee specified");
  await assertCanAccessEmployee(session, employeeId);
  const year = q.year ?? new Date().getUTCFullYear();
  return NextResponse.json({ year, data: await getBalances(employeeId, year) });
});
