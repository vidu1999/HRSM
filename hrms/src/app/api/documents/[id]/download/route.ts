import { eq } from "drizzle-orm";
import { apiHandler } from "@/lib/http";
import { db, documents } from "@/db";
import { assertCan, assertCanAccessEmployee } from "@/lib/rbac";
import { notFound } from "@/lib/errors";
import { requireSession } from "@/lib/session";

export const GET = apiHandler(async (_req: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  assertCan(session, "documents:read");
  const { id } = await context.params;
  const [document] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!document) throw notFound("Document");
  if (document.employeeId) await assertCanAccessEmployee(session, document.employeeId);
  if (!document.contentBase64) throw notFound("Document file");
  const bytes = Buffer.from(document.contentBase64, "base64");
  const safeName = document.fileName.replace(/[\r\n"\\]/g, "_");
  return new Response(bytes, {
    headers: {
      "content-type": document.mimeType,
      "content-length": String(bytes.byteLength),
      "content-disposition": `attachment; filename="${safeName}"`,
      "cache-control": "private, no-store",
    },
  });
});
