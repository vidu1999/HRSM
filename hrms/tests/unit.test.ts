import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/lib/rbac";
import type { Session } from "@/lib/session";
import { countWorkingDays, isoDateAddDays, todayInAppZone } from "@/lib/workdays";
import { upcomingBirthdays } from "@/lib/services/dashboard";
import { hashPassword, verifyPassword } from "@/lib/password";
import { leaveCreateSchema } from "@/lib/validation";
import { signSessionToken, verifySessionToken } from "@/lib/token";

const session = (role: Session["role"]): Session => ({
  userId: "00000000-0000-4000-8000-000000000001",
  email: `${role.toLowerCase()}@test.local`,
  role,
  employeeId: null,
});

describe("RBAC matrix", () => {
  it("only HR and super admins can write employees and see salaries", () => {
    expect(can(session("SUPER_ADMIN"), "employees:write")).toBe(true);
    expect(can(session("HR_ADMIN"), "salary:read")).toBe(true);
    expect(can(session("MANAGER"), "employees:write")).toBe(false);
    expect(can(session("MANAGER"), "salary:read")).toBe(false);
    expect(can(session("EMPLOYEE"), "salary:read")).toBe(false);
  });

  it("restricts audit log access to admins", () => {
    expect(can(session("HR_ADMIN"), "audit:read")).toBe(true);
    expect(can(session("MANAGER"), "audit:read")).toBe(false);
    expect(can(session("EMPLOYEE"), "audit:read")).toBe(false);
  });

  it("every permission lists only known roles", () => {
    const roles = new Set(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]);
    for (const allowed of Object.values(PERMISSIONS)) {
      for (const r of allowed) expect(roles.has(r)).toBe(true);
    }
  });
});

describe("working days", () => {
  it("excludes weekends", () => {
    // Mon 2031-03-03 .. Sun 2031-03-09 => 5 working days
    expect(countWorkingDays("2031-03-03", "2031-03-09")).toBe(5);
  });

  it("counts a single weekday as one day and a weekend as zero", () => {
    expect(countWorkingDays("2031-03-03", "2031-03-03")).toBe(1);
    expect(countWorkingDays("2031-03-08", "2031-03-09")).toBe(0);
  });

  it("returns 0 for reversed ranges and respects holidays", () => {
    expect(countWorkingDays("2031-03-05", "2031-03-03")).toBe(0);
    expect(countWorkingDays("2031-03-03", "2031-03-05", new Set(["2031-03-04"]))).toBe(2);
  });

  it("adds days across month boundaries", () => {
    expect(isoDateAddDays("2031-01-31", 1)).toBe("2031-02-01");
    expect(isoDateAddDays("2031-03-01", -6)).toBe("2031-02-23");
  });

  it("derives today in Asia/Colombo, not UTC", () => {
    // 2026-10-09 22:30 UTC is already 2026-10-10 in Colombo (UTC+5:30)
    expect(todayInAppZone(new Date("2026-10-09T22:30:00Z"))).toBe("2026-10-10");
  });
});

describe("birthdays", () => {
  const rows = [
    { id: "a", birthDate: "1990-10-10" },
    { id: "b", birthDate: "1990-10-12" },
    { id: "c", birthDate: "1990-01-01" },
    { id: "d", birthDate: null },
  ];
  it("sorts by days away and skips missing dates", () => {
    const result = upcomingBirthdays(rows, "2026-10-10", 30);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result[0].daysAway).toBe(0);
    expect(result[1].daysAway).toBe(2);
  });
  it("wraps around the new year", () => {
    const result = upcomingBirthdays(rows, "2026-12-30", 10);
    expect(result.map((r) => r.id)).toEqual(["c"]);
    expect(result[0].nextOccurrence).toBe("2027-01-01");
  });
});

describe("passwords and tokens", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const hash = await hashPassword("Correct-Horse-1");
    expect(hash).not.toContain("Correct-Horse-1");
    expect(await verifyPassword("Correct-Horse-1", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  }, 30000);

  it("round-trips a signed session token and rejects tampering", async () => {
    process.env.AUTH_SECRET = "unit-test-secret-that-is-long-enough-123";
    const claims = { userId: "u1", email: "a@b.c", role: "HR_ADMIN" as const, employeeId: null };
    const token = await signSessionToken(claims);
    expect(await verifySessionToken(token)).toEqual(claims);
    expect(await verifySessionToken(token.slice(0, -2) + "xx")).toBeNull();
  });
});

describe("input validation", () => {
  const base = { leaveTypeId: "11111111-1111-4111-8111-111111111111", reason: "x" };
  it("rejects calendar dates that roll over", () => {
    expect(leaveCreateSchema.safeParse({ ...base, startDate: "2026-02-30", endDate: "2026-03-01" }).success).toBe(false);
  });
  it("accepts a real calendar date", () => {
    expect(leaveCreateSchema.safeParse({ ...base, startDate: "2028-02-29", endDate: "2028-03-01" }).success).toBe(true);
  });
});
