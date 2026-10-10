import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/token";

export async function POST() {
  // Relative Location keeps redirects correct behind proxies (no internal host leaks).
  const res = new NextResponse(null, { status: 303, headers: { Location: "/login" } });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
