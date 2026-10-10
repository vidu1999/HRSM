import { NextResponse } from "next/server";
import { apiHandler, clientInfo } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { cancelLeaveRequest } from "@/lib/services/leave";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  return NextResponse.json(await cancelLeaveRequest(session, clientInfo(req), id));
});
