import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/http";
import { assertCan } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { auditQuerySchema } from "@/lib/validation";
import { listAuditLogs } from "@/lib/services/audit";

export const GET = apiHandler(async (req: Request) => {
  const session = await requireSession();
  assertCan(session, "audit:read");
  const q = auditQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ data: await listAuditLogs(q) });
});
