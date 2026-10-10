import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { getDashboard } from "@/lib/services/dashboard";

export const GET = apiHandler(async () => {
  const session = await requireSession();
  return NextResponse.json(await getDashboard(session));
});
