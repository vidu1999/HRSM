import { NextResponse } from "next/server";
import { apiHandler, clientInfo } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { assertCan } from "@/lib/rbac";
import { createDocument, getDocuments } from "@/lib/services/modules";
import { badRequest } from "@/lib/errors";

export const GET = apiHandler(async () => {
  const session = await requireSession();
  assertCan(session, "documents:read");
  return NextResponse.json({ documents: await getDocuments(session) });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  assertCan(session, "documents:write");
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest("Upload must use multipart form data");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("Choose a file to upload");
  if (file.size === 0) throw badRequest("The selected file is empty");
  if (file.size > 2_500_000) throw badRequest("Files must be 2.5 MB or smaller");
  const title = String(form.get("title") ?? file.name).trim();
  const category = String(form.get("category") ?? "Other").trim();
  const employeeId = String(form.get("employeeId") ?? "").trim() || undefined;
  if (!title || title.length > 200) throw badRequest("Title must be between 1 and 200 characters");
  if (!category || category.length > 80) throw badRequest("Choose a valid document category");
  const bytes = Buffer.from(await file.arrayBuffer());
  const created = await createDocument(session, clientInfo(req), {
    title,
    category,
    fileName: file.name.replace(/[\r\n\\/]/g, "_").slice(0, 255),
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    contentBase64: bytes.toString("base64"),
    employeeId,
  });
  return NextResponse.json(created, { status: 201 });
});
