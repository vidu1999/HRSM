import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { checkIn, checkOut, getTodayStatus, listAttendance } from "@/lib/services/attendance";
import { isoDateAddDays, todayInAppZone } from "@/lib/workdays";

const query = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const q = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const to = q.to ?? todayInAppZone();
  const from = q.from ?? isoDateAddDays(to, -6);
  if (from > to) throw badRequest("'from' must be on or before 'to'");
  return NextResponse.json({
    today: await getTodayStatus(session),
    data: await listAttendance(session, from, to),
  });
});

const actionSchema = z.object({ action: z.enum(["CHECK_IN", "CHECK_OUT"]) });

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const { action } = actionSchema.parse(await readJson(req));
  const client = clientInfo(req);
  const row = action === "CHECK_IN" ? await checkIn(session, client) : await checkOut(session, client);
  return NextResponse.json(row, { status: 201 });
});
