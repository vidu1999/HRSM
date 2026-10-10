import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler, readJson } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { listNotifications, markNotificationsRead } from "@/lib/services/modules";

const schema = z.object({ id: z.uuid().optional() });

export const GET = apiHandler(async () => {
  const session = await requireSession();
  const notifications = await listNotifications(session);
  return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.isRead).length });
});

export const PATCH = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = schema.parse(await readJson(req));
  return NextResponse.json(await markNotificationsRead(session, input.id));
});
