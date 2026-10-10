import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { createPerformanceGoal, getPerformanceSnapshot } from "@/lib/services/modules";

const schema = z.object({
  employeeId: z.uuid(),
  title: z.string().trim().min(3).max(180),
  category: z.string().trim().min(2).max(60),
  description: z.string().max(1000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GET = apiHandler(async () => {
  const session = await requireSession();
  assertCan(session, "performance:read");
  return NextResponse.json(await getPerformanceSnapshot(session));
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = schema.parse(await readJson(req));
  return NextResponse.json(await createPerformanceGoal(session, clientInfo(req), input), { status: 201 });
});
