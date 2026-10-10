import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { createLeaveRequest, listLeaveRequests } from "@/lib/services/leave";
import { leaveCreateSchema, leaveQuerySchema } from "@/lib/validation";

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const q = leaveQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ data: await listLeaveRequests(session, q) });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = leaveCreateSchema.parse(await readJson(req));
  const created = await createLeaveRequest(session, clientInfo(req), input);
  return NextResponse.json(created, { status: 201 });
});
