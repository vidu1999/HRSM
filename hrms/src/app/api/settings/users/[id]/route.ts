import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users } from "@/db";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { forbidden, notFound } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ role: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]) });

export const PATCH = apiHandler(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") throw forbidden("Only a super admin may change access roles");
  const { id } = await context.params;
  const { role } = schema.parse(await readJson(req));
  if (id === session.userId && role !== "SUPER_ADMIN") throw forbidden("You cannot remove your own super admin access");
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(users).where(eq(users.id, id)).for("update").limit(1);
    if (!current) throw notFound("User");
    const [updated] = await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning({ id: users.id, role: users.role });
    await recordAudit(tx, session, clientInfo(req), { action: "USER_ROLE_CHANGED", entityType: "user", entityId: id, oldValue: { role: current.role }, newValue: { role } });
    return NextResponse.json(updated);
  });
});
