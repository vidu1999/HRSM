import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { recordAudit } from "../audit";
import { HttpError } from "../errors";
import { DUMMY_HASH, verifyPassword } from "../password";
import { signSessionToken, type Session } from "../session";
import type { ClientInfo } from "../types";
import { logger } from "../logger";

const GENERIC_FAILURE = "Invalid email or password";

export async function login(email: string, password: string, client: ClientInfo) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always run a bcrypt comparison so response timing doesn't reveal which emails exist.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.isActive || !valid) {
    logger.warn({ email, ip: client.ipAddress }, "Failed login attempt");
    throw new HttpError(401, GENERIC_FAILURE);
  }

  const session: Session = {
    userId: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };

  await db.transaction(async (tx) => {
    await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await recordAudit(tx, session, client, { action: "LOGIN", entityType: "user", entityId: user.id });
  });

  return { token: await signSessionToken(session), session };
}
