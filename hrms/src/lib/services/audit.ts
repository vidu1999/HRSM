import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { auditLogs, db } from "@/db";

export async function listAuditLogs(q: { entityType?: string; action?: string; limit: number; offset: number }) {
  const conditions: SQL[] = [];
  if (q.entityType) conditions.push(eq(auditLogs.entityType, q.entityType));
  if (q.action) conditions.push(ilike(auditLogs.action, `%${q.action.replace(/[%_]/g, "\\$&")}%`));
  return db
    .select()
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(q.limit)
    .offset(q.offset);
}
