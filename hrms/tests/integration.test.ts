/**
 * Integration tests against a real PostgreSQL database (DATABASE_URL).
 * Each run creates isolated records with a unique suffix, so it's safe to run against the dev seed.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, pool, attendanceRecords, auditLogs, departments, employees, leaveBalances, leaveRequests, leaveTypes, users } from "@/db";
import { HttpError } from "@/lib/errors";
import { decideLeaveRequest, cancelLeaveRequest, createLeaveRequest, getBalances } from "@/lib/services/leave";
import { checkIn, checkOut } from "@/lib/services/attendance";
import type { Session } from "@/lib/session";

const CLIENT = { ipAddress: "127.0.0.1", userAgent: "vitest" };
const YEAR_START = "2031-03-03"; // Monday
const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

let deptId: string;
let annualId: string;
const ids: Record<string, string> = {};
const userIds: Record<string, string> = {};

const sessionFor = (key: "hr" | "manager" | "member" | "outsider"): Session => ({
  userId: userIds[key],
  email: `${key}.${suffix}@test.local`,
  role: key === "hr" ? "HR_ADMIN" : key === "manager" ? "MANAGER" : "EMPLOYEE",
  employeeId: ids[key],
});

async function expectHttp(promise: Promise<unknown>, status: number) {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(status);
    return;
  }
  throw new Error(`Expected HttpError ${status}`);
}

beforeAll(async () => {
  const [dept] = await db.insert(departments).values({ name: `Test ${suffix}`, code: `T${suffix}`.slice(0, 10) }).returning();
  deptId = dept.id;
  const [annual] = await db.select().from(leaveTypes).where(eq(leaveTypes.code, "ANNUAL")).limit(1);
  annualId = annual.id;

  const people = [
    ["hr", "Hr"],
    ["manager", "Mgr"],
    ["member", "Mem"],
    ["outsider", "Out"],
  ] as const;
  for (const [key, first] of people) {
    const [e] = await db
      .insert(employees)
      .values({
        employeeNumber: `TST-${suffix}-${key}`,
        firstName: first,
        lastName: suffix,
        email: `${key}.${suffix}@test.local`,
        jobTitle: "Tester",
        departmentId: deptId,
        joinDate: "2024-01-01",
      })
      .returning();
    ids[key] = e.id;
  }
  // member reports to manager; outsider has no relationship.
  await db.update(employees).set({ managerId: ids.manager }).where(eq(employees.id, ids.member));

  for (const [key] of people) {
    const [u] = await db
      .insert(users)
      .values({ email: `${key}.${suffix}@test.local`, passwordHash: "x", role: key === "hr" ? "HR_ADMIN" : key === "manager" ? "MANAGER" : "EMPLOYEE", employeeId: ids[key] })
      .returning();
    userIds[key] = u.id;
  }
});

afterAll(async () => {
  const empIds = Object.values(ids);
  await db.delete(auditLogs).where(inArray(auditLogs.actorEmail, Object.values(sessionEmails())));
  await db.delete(leaveRequests).where(inArray(leaveRequests.employeeId, empIds));
  await db.delete(leaveBalances).where(inArray(leaveBalances.employeeId, empIds));
  await db.delete(attendanceRecords).where(inArray(attendanceRecords.employeeId, empIds));
  await db.delete(users).where(inArray(users.id, Object.values(userIds)));
  await db.delete(employees).where(inArray(employees.id, empIds));
  await db.delete(departments).where(eq(departments.id, deptId));
  await pool.end();
});

function sessionEmails() {
  return { hr: `hr.${suffix}@test.local`, manager: `manager.${suffix}@test.local`, member: `member.${suffix}@test.local`, outsider: `outsider.${suffix}@test.local` };
}

describe("leave workflow", () => {
  it("creates a pending request reserving working days (weekend excluded)", async () => {
    const req = await createLeaveRequest(sessionFor("member"), CLIENT, {
      leaveTypeId: annualId,
      startDate: YEAR_START, // Mon
      endDate: "2031-03-07", // Fri => 5 working days
    });
    expect(req.status).toBe("PENDING");
    expect(req.days).toBe(5);
    ids.req1 = req.id;

    const annual = (await getBalances(ids.member, 2031)).find((b) => b.code === "ANNUAL")!;
    expect(annual.allocated).toBe(14);
    expect(annual.pending).toBe(5);
    expect(annual.remaining).toBe(9);
  });

  it("rejects overlapping requests", async () => {
    await expectHttp(
      createLeaveRequest(sessionFor("member"), CLIENT, { leaveTypeId: annualId, startDate: "2031-03-06", endDate: "2031-03-10" }),
      409,
    );
  });

  it("rejects requests exceeding the remaining balance", async () => {
    // 9 days remain; requesting 10 working days (Mon 2031-03-10 .. Fri 2031-03-21) must fail.
    await expectHttp(
      createLeaveRequest(sessionFor("member"), CLIENT, { leaveTypeId: annualId, startDate: "2031-03-10", endDate: "2031-03-21" }),
      409,
    );
  });

  it("blocks self-approval even for the requester's own manager chain", async () => {
    await expectHttp(decideLeaveRequest(sessionFor("member"), CLIENT, ids.req1, "APPROVE"), 403);
  });

  it("blocks managers from deciding requests outside their reporting tree", async () => {
    const outsiderReq = await createLeaveRequest(sessionFor("outsider"), CLIENT, {
      leaveTypeId: annualId,
      startDate: "2031-04-07",
      endDate: "2031-04-07",
    });
    ids.outsiderReq = outsiderReq.id;
    await expectHttp(decideLeaveRequest(sessionFor("manager"), CLIENT, outsiderReq.id, "APPROVE"), 403);
  });

  it("lets the manager approve a direct report and debits the balance", async () => {
    const approved = await decideLeaveRequest(sessionFor("manager"), CLIENT, ids.req1, "APPROVE", "Enjoy");
    expect(approved.status).toBe("APPROVED");
    expect(approved.decisionNote).toBe("Enjoy");

    const annual = (await getBalances(ids.member, 2031)).find((b) => b.code === "ANNUAL")!;
    expect(annual.used).toBe(5);
    expect(annual.pending).toBe(0);
    expect(annual.remaining).toBe(9);
  });

  it("prevents deciding an already-decided request", async () => {
    await expectHttp(decideLeaveRequest(sessionFor("hr"), CLIENT, ids.req1, "REJECT"), 409);
  });

  it("lets HR reject a request without touching the balance", async () => {
    const rejected = await decideLeaveRequest(sessionFor("hr"), CLIENT, ids.outsiderReq, "REJECT", "Not this month");
    expect(rejected.status).toBe("REJECTED");
    const outsider = (await getBalances(ids.outsider, 2031)).find((b) => b.code === "ANNUAL")!;
    expect(outsider.used).toBe(0);
  });

  it("lets the employee cancel their pending request", async () => {
    const pending = await createLeaveRequest(sessionFor("member"), CLIENT, {
      leaveTypeId: annualId,
      startDate: "2031-05-05",
      endDate: "2031-05-05",
    });
    const cancelled = await cancelLeaveRequest(sessionFor("member"), CLIENT, pending.id);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("restores balance when HR cancels approved leave that hasn't started", async () => {
    const before = (await getBalances(ids.member, 2031)).find((b) => b.code === "ANNUAL")!.used;
    const cancelled = await cancelLeaveRequest(sessionFor("hr"), CLIENT, ids.req1);
    expect(cancelled.status).toBe("CANCELLED");
    const after = (await getBalances(ids.member, 2031)).find((b) => b.code === "ANNUAL")!.used;
    expect(after).toBe(before - 5);
  });

  it("concurrent approvals of different requests never lose a balance update", async () => {
    const a = await createLeaveRequest(sessionFor("member"), CLIENT, { leaveTypeId: annualId, startDate: "2031-06-02", endDate: "2031-06-04" });
    const b = await createLeaveRequest(sessionFor("member"), CLIENT, { leaveTypeId: annualId, startDate: "2031-06-09", endDate: "2031-06-10" });
    const results = await Promise.allSettled([
      decideLeaveRequest(sessionFor("manager"), CLIENT, a.id, "APPROVE"),
      decideLeaveRequest(sessionFor("manager"), CLIENT, b.id, "APPROVE"),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const annual = (await getBalances(ids.member, 2031)).find((x) => x.code === "ANNUAL")!;
    // Previously used: 0 (req1 cancelled). Now 3 + 2 = 5.
    expect(annual.used).toBe(5);
  });

  it("rejects requests that contain no working days", async () => {
    await expectHttp(
      createLeaveRequest(sessionFor("member"), CLIENT, { leaveTypeId: annualId, startDate: "2031-07-05", endDate: "2031-07-06" }),
      400,
    );
  });
});

describe("attendance", () => {
  it("allows one check-in and one check-out per day", async () => {
    const now = new Date();
    await checkIn(sessionFor("member"), CLIENT, now);
    await expectHttp(checkIn(sessionFor("member"), CLIENT, now), 409);
    await checkOut(sessionFor("member"), CLIENT, new Date(now.getTime() + 8 * 3600_000));
    await expectHttp(checkOut(sessionFor("member"), CLIENT, now), 409);
  });

  it("refuses check-out without a check-in", async () => {
    await expectHttp(checkOut(sessionFor("outsider"), CLIENT, new Date()), 409);
  });
});

describe("audit trail", () => {
  it("records leave decisions with actor email", async () => {
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.actorEmail, sessionEmails().manager));
    expect(rows.some((r) => r.action === "LEAVE_APPROVED")).toBe(true);
  });
});
