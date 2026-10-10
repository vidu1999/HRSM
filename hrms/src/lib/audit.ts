import type { Session } from "./session";
import { auditLogs, db } from "@/db";
import type { DbTx } from "@/db/types";
import type { ClientInfo } from "./types";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
};

/**
 * Append-only audit trail. Pass the transaction executor so the audit row
 * commits or rolls back together with the change it describes.
 */
export async function recordAudit(
  executor: typeof db | DbTx,
  session: Session | null,
  client: ClientInfo | null,
  input: AuditInput,
): Promise<void> {
  await executor.insert(auditLogs).values({
    actorUserId: session?.userId ?? null,
    actorEmail: session?.email ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    oldValue: (input.oldValue ?? null) as object | null,
    newValue: (input.newValue ?? null) as object | null,
    ipAddress: client?.ipAddress ?? null,
    userAgent: client?.userAgent ?? null,
  });
}
