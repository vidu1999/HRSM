import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db, employees, leaveBalances, leaveRequests, leaveTypes, type LeaveStatus } from "@/db";
import type { DbTx } from "@/db/types";
import { recordAudit } from "../audit";
import { badRequest, conflict, forbidden, notFound } from "../errors";
import { assertCanAccessEmployee, can, canAccessEmployee, hasOrgScope, scopeFilter, visibleEmployeeIds } from "../rbac";
import type { Session } from "../session";
import type { ClientInfo } from "../types";
import { countWorkingDays, todayInAppZone } from "../workdays";

export type CreateLeaveInput = {
  employeeId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

const ACTIVE_STATUSES: LeaveStatus[] = ["PENDING", "APPROVED"];

/**
 * Returns the balance row for (employee, type, year), creating it from the
 * leave type's allowance on first use. Caller must hold a transaction.
 */
async function lockBalance(tx: DbTx, employeeId: string, leaveTypeId: string, year: number) {
  const [type] = await tx.select().from(leaveTypes).where(eq(leaveTypes.id, leaveTypeId)).limit(1);
  if (!type) throw notFound("Leave type");

  await tx
    .insert(leaveBalances)
    .values({ employeeId, leaveTypeId, year, allocated: type.annualAllowance, used: 0 })
    .onConflictDoNothing();

  const [balance] = await tx
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.employeeId, employeeId),
        eq(leaveBalances.leaveTypeId, leaveTypeId),
        eq(leaveBalances.year, year),
      ),
    )
    .for("update")
    .limit(1);
  if (!balance) throw notFound("Leave balance");
  return { type, balance };
}

export async function getBalances(employeeId: string, year: number) {
  const rows = await db
    .select({
      leaveTypeId: leaveTypes.id,
      code: leaveTypes.code,
      name: leaveTypes.name,
      isPaid: leaveTypes.isPaid,
      allocated: leaveTypes.annualAllowance,
      used: sql<number>`coalesce(${leaveBalances.used}, 0)`,
      allocatedOverride: leaveBalances.allocated,
    })
    .from(leaveTypes)
    .leftJoin(
      leaveBalances,
      and(eq(leaveBalances.leaveTypeId, leaveTypes.id), eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)),
    )
    .orderBy(leaveTypes.code);

  // Pending requests reserve days so employees cannot over-apply before approval.
  const pending = await db
    .select({ leaveTypeId: leaveRequests.leaveTypeId, days: sql<number>`sum(${leaveRequests.days})::int` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.status, "PENDING"),
        sql`extract(year from ${leaveRequests.startDate}) = ${year}`,
      ),
    )
    .groupBy(leaveRequests.leaveTypeId);
  const pendingByType = new Map(pending.map((p) => [p.leaveTypeId, Number(p.days)]));

  return rows.map((r) => {
    const allocated = r.allocatedOverride ?? r.allocated;
    const pendingDays = pendingByType.get(r.leaveTypeId) ?? 0;
    return {
      leaveTypeId: r.leaveTypeId,
      code: r.code,
      name: r.name,
      isPaid: r.isPaid,
      allocated,
      used: Number(r.used),
      pending: pendingDays,
      remaining: allocated - Number(r.used) - pendingDays,
    };
  });
}

export async function createLeaveRequest(session: Session, client: ClientInfo, input: CreateLeaveInput) {
  const employeeId = input.employeeId ?? session.employeeId;
  if (!employeeId) throw badRequest("Your account is not linked to an employee record");

  const isSelf = employeeId === session.employeeId;
  if (!isSelf) {
    if (!can(session, "leave:create")) throw forbidden();
    await assertCanAccessEmployee(session, employeeId);
  }

  if (input.endDate < input.startDate) throw badRequest("End date must be on or after start date");
  const days = countWorkingDays(input.startDate, input.endDate);
  if (days === 0) throw badRequest("The selected range contains no working days");
  if (days > 60) throw badRequest("A single request may not exceed 60 working days");

  const year = Number(input.startDate.slice(0, 4));

  return db.transaction(async (tx) => {
    // Serialise leave submissions per employee to avoid double-booking races.
    const [employee] = await tx.select().from(employees).where(eq(employees.id, employeeId)).for("update").limit(1);
    if (!employee) throw notFound("Employee");
    if (employee.status === "TERMINATED" || employee.status === "INACTIVE") {
      throw badRequest("Leave cannot be requested for an inactive employee");
    }

    const [overlap] = await tx
      .select({ id: leaveRequests.id })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, employeeId),
          inArray(leaveRequests.status, ACTIVE_STATUSES),
          lte(leaveRequests.startDate, input.endDate),
          gte(leaveRequests.endDate, input.startDate),
        ),
      )
      .limit(1);
    if (overlap) throw conflict("An existing pending or approved request overlaps these dates");

    const { type, balance } = await lockBalance(tx, employeeId, input.leaveTypeId, year);

    if (type.isPaid) {
      const [pending] = await tx
        .select({ days: sql<number>`coalesce(sum(${leaveRequests.days}), 0)::int` })
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.employeeId, employeeId),
            eq(leaveRequests.leaveTypeId, type.id),
            eq(leaveRequests.status, "PENDING"),
          ),
        );
      const remaining = balance.allocated - balance.used - Number(pending.days);
      if (days > remaining) {
        throw conflict(`Insufficient ${type.name} balance: ${remaining} day(s) remaining, ${days} requested`);
      }
    }

    const [created] = await tx
      .insert(leaveRequests)
      .values({
        employeeId,
        leaveTypeId: type.id,
        startDate: input.startDate,
        endDate: input.endDate,
        days,
        reason: input.reason?.trim() || null,
        status: "PENDING",
      })
      .returning();

    await recordAudit(tx, session, client, {
      action: "LEAVE_REQUESTED",
      entityType: "leave_request",
      entityId: created.id,
      newValue: { employeeId, leaveType: type.code, startDate: input.startDate, endDate: input.endDate, days },
    });
    return created;
  });
}

export type Decision = "APPROVE" | "REJECT";

export async function decideLeaveRequest(
  session: Session,
  client: ClientInfo,
  requestId: string,
  decision: Decision,
  note?: string,
) {
  if (!can(session, "leave:decide")) throw forbidden();

  const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
  if (!request) throw notFound("Leave request");

  // Self-approval is never allowed, even for HR admins. Managers may only decide for their own tree.
  if (request.employeeId === session.employeeId) throw forbidden("You cannot approve your own leave");
  if (!hasOrgScope(session) && !(await canAccessEmployee(session, request.employeeId))) {
    throw forbidden("Employee is outside your scope");
  }

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .for("update")
      .limit(1);
    if (!current) throw notFound("Leave request");
    if (current.status !== "PENDING") throw conflict(`Request is already ${current.status.toLowerCase()}`);

    const year = Number(current.startDate.slice(0, 4));
    if (decision === "APPROVE") {
      const { type, balance } = await lockBalance(tx, current.employeeId, current.leaveTypeId, year);
      const remaining = balance.allocated - balance.used;
      if (type.isPaid && current.days > remaining) {
        throw conflict(`Insufficient ${type.name} balance: ${remaining} day(s) remaining`);
      }
      await tx
        .update(leaveBalances)
        .set({ used: balance.used + current.days, updatedAt: new Date() })
        .where(eq(leaveBalances.id, balance.id));
    }

    const nextStatus: LeaveStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const [updated] = await tx
      .update(leaveRequests)
      .set({
        status: nextStatus,
        decidedByUserId: session.userId,
        decidedAt: new Date(),
        decisionNote: note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    await recordAudit(tx, session, client, {
      action: decision === "APPROVE" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      entityType: "leave_request",
      entityId: requestId,
      oldValue: { status: current.status },
      newValue: { status: nextStatus, note: note ?? null },
    });
    return updated;
  });
}

/** Employees cancel their own pending leave; HR may also cancel approved leave that hasn't started. */
export async function cancelLeaveRequest(session: Session, client: ClientInfo, requestId: string) {
  const [request] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
  if (!request) throw notFound("Leave request");

  const isOwner = request.employeeId === session.employeeId;
  const isHr = hasOrgScope(session);
  if (!isOwner && !isHr) throw forbidden();

  const today = todayInAppZone();
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).for("update").limit(1);
    if (!current) throw notFound("Leave request");

    if (current.status === "PENDING") {
      // ok
    } else if (current.status === "APPROVED" && isHr && current.startDate > today) {
      const year = Number(current.startDate.slice(0, 4));
      const { balance } = await lockBalance(tx, current.employeeId, current.leaveTypeId, year);
      await tx
        .update(leaveBalances)
        .set({ used: Math.max(0, balance.used - current.days), updatedAt: new Date() })
        .where(eq(leaveBalances.id, balance.id));
    } else {
      throw conflict(`Request can no longer be cancelled (status: ${current.status.toLowerCase()})`);
    }

    const [updated] = await tx
      .update(leaveRequests)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(eq(leaveRequests.id, requestId))
      .returning();

    await recordAudit(tx, session, client, {
      action: "LEAVE_CANCELLED",
      entityType: "leave_request",
      entityId: requestId,
      oldValue: { status: current.status },
      newValue: { status: "CANCELLED" },
    });
    return updated;
  });
}

export type LeaveListFilter = {
  status?: LeaveStatus;
  employeeId?: string;
  limit: number;
  offset: number;
};

export async function listLeaveRequests(session: Session, filter: LeaveListFilter) {
  const scope = await visibleEmployeeIds(session);
  const conditions: SQL[] = [];
  const scoped = scopeFilter(leaveRequests.employeeId, scope);
  if (scoped) conditions.push(scoped);
  if (filter.status) conditions.push(eq(leaveRequests.status, filter.status));
  if (filter.employeeId) conditions.push(eq(leaveRequests.employeeId, filter.employeeId));

  const where = conditions.length ? and(...conditions) : undefined;
  const rows = await db
    .select({
      id: leaveRequests.id,
      status: leaveRequests.status,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      decisionNote: leaveRequests.decisionNote,
      decidedAt: leaveRequests.decidedAt,
      createdAt: leaveRequests.createdAt,
      employeeId: employees.id,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeNumber: employees.employeeNumber,
      leaveType: leaveTypes.name,
      leaveTypeCode: leaveTypes.code,
      managerId: employees.managerId,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .where(where)
    .orderBy(desc(leaveRequests.createdAt))
    .limit(filter.limit)
    .offset(filter.offset);

  return rows;
}

