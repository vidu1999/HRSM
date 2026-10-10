import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { updatePerformanceGoal } from "@/lib/services/modules";

const schema = z.object({ progress: z.number().int().min(0).max(100) });

export const PATCH = apiHandler(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await context.params;
  const { progress } = schema.parse(await readJson(req));
  return NextResponse.json(await updatePerformanceGoal(session, clientInfo(req), id, progress));
});
