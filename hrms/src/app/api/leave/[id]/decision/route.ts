import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { decideLeaveRequest } from "@/lib/services/leave";
import { leaveDecisionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const { decision, note } = leaveDecisionSchema.parse(await readJson(req));
  return NextResponse.json(await decideLeaveRequest(session, clientInfo(req), id, decision, note));
});
