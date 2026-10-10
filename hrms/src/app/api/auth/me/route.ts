import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/http";
import { requireSession } from "@/lib/session";

export const GET = apiHandler(async () => {
  const s = await requireSession();
  return NextResponse.json({ user: { email: s.email, role: s.role, employeeId: s.employeeId } });
});
