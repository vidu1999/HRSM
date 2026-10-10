import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Used to keep login timing constant when the email does not exist.
export const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8YzQx7ZC1Vt4oJ3m7e1Tq0kq0bS1yK";
