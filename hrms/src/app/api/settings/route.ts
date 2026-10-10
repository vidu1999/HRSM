import { NextResponse } from "next/server";
import { z } from "zod";
import { asc } from "drizzle-orm";
import { db, users } from "@/db";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getApplicationSettings, saveApplicationSettings } from "@/lib/services/modules";

const schema = z.record(z.string(), z.record(z.string(), z.unknown())).refine((data) => Object.keys(data).length > 0, "Provide settings to update");

export const GET = apiHandler(async () => {
  const session = await requireSession();
  assertCan(session, "settings:read");
  const [settings, accounts] = await Promise.all([
    getApplicationSettings(),
    db.select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive }).from(users).orderBy(asc(users.email)),
  ]);
  return NextResponse.json({ settings, accounts });
});

export const PATCH = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = schema.parse(await readJson(req));
  return NextResponse.json(await saveApplicationSettings(session, clientInfo(req), input));
});
