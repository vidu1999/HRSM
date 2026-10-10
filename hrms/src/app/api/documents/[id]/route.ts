import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { removeDocument } from "@/lib/services/modules";
import { clientInfo } from "@/lib/http";

export const DELETE = apiHandler(async (req: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await context.params;
  return NextResponse.json(await removeDocument(session, clientInfo(req), id));
});
