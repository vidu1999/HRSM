// Edge-safe JWT helpers (jose only). Keep Node/database imports out of this file:
// it is imported by middleware, which runs on the Edge runtime.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/db/schema";

export const SESSION_COOKIE = "hrms_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionClaims = {
  userId: string;
  email: string;
  role: Role;
  employeeId: string | null;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(s: SessionClaims): Promise<string> {
  return new SignJWT({ email: s.email, role: s.role, employeeId: s.employeeId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("hrms")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "hrms", algorithms: ["HS256"] });
    return {
      userId: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
      employeeId: (payload.employeeId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
