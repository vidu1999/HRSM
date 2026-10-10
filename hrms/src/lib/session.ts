import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";
import { HttpError } from "./errors";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, verifySessionToken, type SessionClaims } from "./token";

export { SESSION_COOKIE, signSessionToken, verifySessionToken } from "./token";
export type Session = SessionClaims;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * Returns the current session, re-validating against the database so that
 * deactivated users lose access immediately (JWTs alone can't be revoked).
 */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role, employeeId: users.employeeId })
    .from(users)
    .where(and(eq(users.id, claims.userId), eq(users.isActive, true)))
    .limit(1);
  if (!user) return null;

  // Role and employee link always come from the database, not the token.
  return { userId: user.id, email: user.email, role: user.role, employeeId: user.employeeId };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Authentication required");
  return session;
}
