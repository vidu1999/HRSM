import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { updateApplicationStage } from "@/lib/services/modules";

const schema = z.object({ stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "DECLINED"]) });

export const PATCH = apiHandler(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await context.params;
  const { stage } = schema.parse(await readJson(req));
  return NextResponse.json(await updateApplicationStage(session, clientInfo(req), id, stage));
});
