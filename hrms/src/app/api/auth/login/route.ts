import { NextResponse } from "next/server";
import { apiHandler, clientInfo, readJson } from "@/lib/http";
import { login } from "@/lib/services/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export const POST = apiHandler(async (req: Request) => {
  const input = loginSchema.parse(await readJson(req));
  const { token, session } = await login(input.email, input.password, clientInfo(req));
  const res = NextResponse.json({ user: { email: session.email, role: session.role, employeeId: session.employeeId } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
});
