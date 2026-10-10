import { and, asc, count, desc, eq, gte, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import {
  appSettings,
  applications,
  auditLogs,
  candidates,
  db,
  departments,
  documents,
  employees,
  jobPosts,
  notifications,
  payrollItems,
  payrollPeriods,
  performanceGoals,
  performanceReviews,
  users,
} from "@/db";
import { recordAudit } from "../audit";
import { badRequest, conflict, notFound } from "../errors";
import { assertCan, assertCanAccessEmployee, can, scopeFilter, visibleEmployeeIds } from "../rbac";
import type { Session } from "../session";
import type { ClientInfo } from "../types";

export async function getPayrollSnapshot() {
  const periods = await db.select().from(payrollPeriods).orderBy(desc(payrollPeriods.period)).limit(12);
  const [employeesRow] = await db.select({ total: count() }).from(employees).where(ne(employees.status, "TERMINATED"));
  const active = await db.select({ total: count() }).from(employees).where(eq(employees.status, "ACTIVE"));
  const latest = periods[0];
  const items = latest
    ? await db
        .select({
          id: payrollItems.id,
          employeeId: employees.id,
          employeeNumber: employees.employeeNumber,
          firstName: employees.firstName,
          lastName: employees.lastName,
          department: departments.name,
          baseLkr: payrollItems.baseLkr,
          allowanceLkr: payrollItems.allowanceLkr,
          overtimeLkr: payrollItems.overtimeLkr,
          deductionsLkr: payrollItems.deductionsLkr,
          netLkr: payrollItems.netLkr,
        })
        .from(payrollItems)
        .innerJoin(employees, eq(employees.id, payrollItems.employeeId))
        .innerJoin(departments, eq(departments.id, employees.departmentId))
        .where(eq(payrollItems.payrollPeriodId, latest.id))
        .orderBy(asc(employees.firstName), asc(employees.lastName))
        .limit(100)
    : [];

  return {
    periods,
    latest,
    items,
    headcount: Number(employeesRow.total),
    activeCount: Number(active[0].total),
  };
}

export async function runPayroll(session: Session, client: ClientInfo, period: string) {
  assertCan(session, "payroll:write");
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) throw badRequest("Payroll period must use YYYY-MM format");
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: payrollPeriods.id }).from(payrollPeriods).where(eq(payrollPeriods.period, period)).limit(1);
    if (existing) throw conflict(`Payroll for ${period} has already been generated`);

    const staff = await tx
      .select({ id: employees.id, baseSalaryLkr: employees.baseSalaryLkr })
      .from(employees)
      .where(eq(employees.status, "ACTIVE"));
    const grossLkr = staff.reduce((sum, employee) => sum + employee.baseSalaryLkr, 0);
    const [batch] = await tx
      .insert(payrollPeriods)
      .values({
        period,
        status: "PROCESSED",
        employeeCount: staff.length,
        grossLkr,
        deductionsLkr: 0,
        netLkr: grossLkr,
        processedAt: new Date(),
        createdByUserId: session.userId,
      })
      .returning();

    if (staff.length) {
      await tx.insert(payrollItems).values(
        staff.map((employee) => ({
          payrollPeriodId: batch.id,
          employeeId: employee.id,
          baseLkr: employee.baseSalaryLkr,
          allowanceLkr: 0,
          overtimeLkr: 0,
          deductionsLkr: 0,
          netLkr: employee.baseSalaryLkr,
        })),
      );
    }

    await recordAudit(tx, session, client, {
      action: "PAYROLL_GENERATED",
      entityType: "payroll_period",
      entityId: batch.id,
      newValue: { period, employeeCount: staff.length, grossLkr, netLkr: grossLkr, simulation: true },
    });
    return batch;
  });
}

export async function getRecruitmentSnapshot() {
  const jobs = await db
    .select({
      id: jobPosts.id,
      title: jobPosts.title,
      status: jobPosts.status,
      employmentType: jobPosts.employmentType,
      location: jobPosts.location,
      postedAt: jobPosts.postedAt,
      departmentId: departments.id,
      department: departments.name,
      applications: sql<number>`(select count(*)::int from ${applications} a where a.job_post_id = ${jobPosts.id})`,
    })
    .from(jobPosts)
    .innerJoin(departments, eq(departments.id, jobPosts.departmentId))
    .orderBy(desc(jobPosts.postedAt));
  const applicants = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      appliedAt: applications.appliedAt,
      interviewAt: applications.interviewAt,
      notes: applications.notes,
      candidateId: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      email: candidates.email,
      source: candidates.source,
      jobId: jobPosts.id,
      jobTitle: jobPosts.title,
      department: departments.name,
    })
    .from(applications)
    .innerJoin(candidates, eq(candidates.id, applications.candidateId))
    .innerJoin(jobPosts, eq(jobPosts.id, applications.jobPostId))
    .innerJoin(departments, eq(departments.id, jobPosts.departmentId))
    .orderBy(desc(applications.createdAt));
  const [openJobs] = await db.select({ total: count() }).from(jobPosts).where(eq(jobPosts.status, "OPEN"));
  const [activeCandidates] = await db.select({ total: count() }).from(applications).where(ne(applications.stage, "HIRED"));
  const [interviews] = await db.select({ total: count() }).from(applications).where(eq(applications.stage, "INTERVIEW"));
  const [offers] = await db.select({ total: count() }).from(applications).where(eq(applications.stage, "OFFER"));
  return {
    jobs,
    applicants,
    stats: { openJobs: Number(openJobs.total), candidates: Number(activeCandidates.total), interviews: Number(interviews.total), offers: Number(offers.total) },
  };
}

export async function createJobPost(session: Session, client: ClientInfo, input: {
  title: string; departmentId: string; employmentType: string; location: string; description?: string;
}) {
  assertCan(session, "recruitment:write");
  const [department] = await db.select({ id: departments.id }).from(departments).where(eq(departments.id, input.departmentId)).limit(1);
  if (!department) throw badRequest("Select a valid department");
  return db.transaction(async (tx) => {
    const [job] = await tx.insert(jobPosts).values({ ...input, status: "OPEN", postedAt: new Date().toISOString().slice(0, 10), createdByUserId: session.userId }).returning();
    await recordAudit(tx, session, client, { action: "JOB_POSTED", entityType: "job_post", entityId: job.id, newValue: { title: job.title, departmentId: job.departmentId } });
    return job;
  });
}

export async function createApplication(session: Session, client: ClientInfo, input: {
  jobPostId: string; firstName: string; lastName: string; email: string; phone?: string; source?: string;
}) {
  assertCan(session, "recruitment:write");
  const [job] = await db.select({ id: jobPosts.id, status: jobPosts.status }).from(jobPosts).where(eq(jobPosts.id, input.jobPostId)).limit(1);
  if (!job || job.status !== "OPEN") throw badRequest("Choose an open job post");
  return db.transaction(async (tx) => {
    let [candidate] = await tx.select().from(candidates).where(eq(candidates.email, input.email.toLowerCase())).limit(1);
    if (!candidate) {
      [candidate] = await tx.insert(candidates).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        source: input.source || "Direct",
      }).returning();
    }
    const [duplicate] = await tx.select({ id: applications.id }).from(applications).where(and(eq(applications.jobPostId, job.id), eq(applications.candidateId, candidate.id))).limit(1);
    if (duplicate) throw conflict("This candidate has already applied to the selected role");
    const [application] = await tx.insert(applications).values({ jobPostId: job.id, candidateId: candidate.id, stage: "APPLIED", appliedAt: new Date().toISOString().slice(0, 10) }).returning();
    await recordAudit(tx, session, client, { action: "APPLICATION_CREATED", entityType: "application", entityId: application.id, newValue: { candidate: input.email, jobPostId: job.id } });
    return application;
  });
}

export async function updateApplicationStage(session: Session, client: ClientInfo, id: string, stage: string) {
  assertCan(session, "recruitment:write");
  const allowed = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "DECLINED"];
  if (!allowed.includes(stage)) throw badRequest("Choose a valid recruitment stage");
  const [current] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!current) throw notFound("Application");
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(applications).set({ stage, updatedAt: new Date() }).where(eq(applications.id, id)).returning();
    await recordAudit(tx, session, client, { action: "APPLICATION_STAGE_CHANGED", entityType: "application", entityId: id, oldValue: { stage: current.stage }, newValue: { stage } });
    return updated;
  });
}

export async function getPerformanceSnapshot(session: Session) {
  const scope = await visibleEmployeeIds(session);
  const scoped = scopeFilter(performanceGoals.employeeId, scope);
  const [goalCount] = await db.select({ total: count() }).from(performanceGoals).where(scoped);
  const [reviewCount] = await db.select({ total: count() }).from(performanceReviews).where(scopeFilter(performanceReviews.employeeId, scope));
  const goals = await db
    .select({
      id: performanceGoals.id,
      title: performanceGoals.title,
      category: performanceGoals.category,
      description: performanceGoals.description,
      progress: performanceGoals.progress,
      status: performanceGoals.status,
      dueDate: performanceGoals.dueDate,
      employeeId: employees.id,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeNumber: employees.employeeNumber,
      department: departments.name,
    })
    .from(performanceGoals)
    .innerJoin(employees, eq(employees.id, performanceGoals.employeeId))
    .innerJoin(departments, eq(departments.id, employees.departmentId))
    .where(scoped)
    .orderBy(asc(performanceGoals.dueDate), asc(performanceGoals.title));
  const reviews = await db
    .select({
      id: performanceReviews.id,
      period: performanceReviews.period,
      rating: performanceReviews.rating,
      status: performanceReviews.status,
      summary: performanceReviews.summary,
      updatedAt: performanceReviews.updatedAt,
      employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`,
      employeeNumber: employees.employeeNumber,
      department: departments.name,
    })
    .from(performanceReviews)
    .innerJoin(employees, eq(employees.id, performanceReviews.employeeId))
    .innerJoin(departments, eq(departments.id, employees.departmentId))
    .where(scopeFilter(performanceReviews.employeeId, scope))
    .orderBy(desc(performanceReviews.updatedAt));
  const averageProgress = goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;
  return { goals, reviews, stats: { goals: Number(goalCount.total), reviews: Number(reviewCount.total), averageProgress } };
}

export async function createPerformanceGoal(session: Session, client: ClientInfo, input: {
  employeeId: string; title: string; category: string; description?: string; dueDate?: string;
}) {
  assertCan(session, "performance:write");
  await assertCanAccessEmployee(session, input.employeeId);
  return db.transaction(async (tx) => {
    const [goal] = await tx.insert(performanceGoals).values({
      ...input,
      description: input.description || null,
      dueDate: input.dueDate || null,
      status: "ON_TRACK",
      progress: 0,
      createdByUserId: session.userId,
    }).returning();
    await recordAudit(tx, session, client, { action: "PERFORMANCE_GOAL_CREATED", entityType: "performance_goal", entityId: goal.id, newValue: { employeeId: goal.employeeId, title: goal.title } });
    return goal;
  });
}

export async function updatePerformanceGoal(session: Session, client: ClientInfo, id: string, progress: number) {
  assertCan(session, "performance:write");
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) throw badRequest("Progress must be between 0 and 100");
  const [current] = await db.select().from(performanceGoals).where(eq(performanceGoals.id, id)).limit(1);
  if (!current) throw notFound("Performance goal");
  await assertCanAccessEmployee(session, current.employeeId);
  return db.transaction(async (tx) => {
    const [updated] = await tx.update(performanceGoals).set({ progress, status: progress >= 100 ? "COMPLETED" : progress < current.progress ? "AT_RISK" : "ON_TRACK", updatedAt: new Date() }).where(eq(performanceGoals.id, id)).returning();
    await recordAudit(tx, session, client, { action: "PERFORMANCE_GOAL_UPDATED", entityType: "performance_goal", entityId: id, oldValue: { progress: current.progress }, newValue: { progress: updated.progress, status: updated.status } });
    return updated;
  });
}

export async function getDocuments(session: Session) {
  const scope = await visibleEmployeeIds(session);
  const where = scope === null ? undefined : scope.length ? or(isNull(documents.employeeId), inArray(documents.employeeId, scope)) : isNull(documents.employeeId);
  return db
    .select({
      id: documents.id,
      title: documents.title,
      category: documents.category,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      employeeId: documents.employeeId,
      createdAt: documents.createdAt,
      employeeName: sql<string | null>`case when ${employees.id} is null then null else ${employees.firstName} || ' ' || ${employees.lastName} end`,
    })
    .from(documents)
    .leftJoin(employees, eq(employees.id, documents.employeeId))
    .where(where)
    .orderBy(desc(documents.createdAt));
}

export async function createDocument(session: Session, client: ClientInfo, input: {
  title: string; category: string; fileName: string; mimeType: string; sizeBytes: number; contentBase64: string; employeeId?: string;
}) {
  assertCan(session, "documents:write");
  if (input.employeeId) await assertCanAccessEmployee(session, input.employeeId);
  return db.transaction(async (tx) => {
    const [doc] = await tx.insert(documents).values({ ...input, employeeId: input.employeeId || null, uploadedByUserId: session.userId }).returning({ id: documents.id, title: documents.title, category: documents.category });
    await recordAudit(tx, session, client, { action: "DOCUMENT_UPLOADED", entityType: "document", entityId: doc.id, newValue: { title: doc.title, category: doc.category, sizeBytes: input.sizeBytes } });
    return doc;
  });
}

export async function removeDocument(session: Session, client: ClientInfo, id: string) {
  assertCan(session, "documents:write");
  const [existing] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!existing) throw notFound("Document");
  return db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.id, id));
    await recordAudit(tx, session, client, { action: "DOCUMENT_DELETED", entityType: "document", entityId: id, oldValue: { title: existing.title, category: existing.category } });
    return { ok: true };
  });
}

export async function getApplicationSettings() {
  const rows = await db.select().from(appSettings).orderBy(asc(appSettings.key));
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function saveApplicationSettings(session: Session, client: ClientInfo, values: Record<string, Record<string, unknown>>) {
  assertCan(session, "settings:write");
  const allowed = new Set(["company", "security", "notifications"]);
  const entries = Object.entries(values);
  if (!entries.length || entries.some(([key, value]) => !allowed.has(key) || !value || typeof value !== "object" || Array.isArray(value))) {
    throw badRequest("Provide one or more valid settings sections");
  }
  return db.transaction(async (tx) => {
    for (const [key, value] of entries) {
      const [before] = await tx.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      await tx.insert(appSettings).values({ key, value, updatedByUserId: session.userId, updatedAt: new Date() }).onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedByUserId: session.userId, updatedAt: new Date() },
      });
      await recordAudit(tx, session, client, { action: "SETTINGS_UPDATED", entityType: "setting", entityId: key, oldValue: before?.value ?? null, newValue: value });
    }
    return { saved: entries.map(([key]) => key) };
  });
}

export async function listNotifications(session: Session) {
  return db.select().from(notifications).where(eq(notifications.userId, session.userId)).orderBy(desc(notifications.createdAt)).limit(10);
}

export async function markNotificationsRead(session: Session, id?: string) {
  const conditions: SQL[] = [eq(notifications.userId, session.userId), eq(notifications.isRead, false)];
  if (id) conditions.push(eq(notifications.id, id));
  await db.update(notifications).set({ isRead: true }).where(and(...conditions));
  return { ok: true };
}

export async function searchWorkspace(session: Session, query: string) {
  const q = query.trim();
  if (!q) return [];
  const scope = await visibleEmployeeIds(session);
  const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const people = await db
    .select({ id: employees.id, name: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`, detail: employees.jobTitle, href: sql<string>`'/employees'`, type: sql<string>`'Employee'` })
    .from(employees)
    .where(and(scopeFilter(employees.id, scope), or(sql`${employees.firstName} ilike ${term}`, sql`${employees.lastName} ilike ${term}`, sql`${employees.email} ilike ${term}`, sql`${employees.employeeNumber} ilike ${term}`)))
    .orderBy(asc(employees.firstName))
    .limit(8);
  const modules = [
    { id: "module-dashboard", name: "Dashboard", detail: "Overview and people analytics", href: "/", type: "Module" },
    { id: "module-employees", name: "Employees", detail: "People directory and profiles", href: "/employees", type: "Module" },
    { id: "module-organization", name: "Organization", detail: "Departments and reporting lines", href: "/organization", type: "Module" },
    { id: "module-attendance", name: "Attendance", detail: "Time and attendance records", href: "/attendance", type: "Module" },
    { id: "module-leave", name: "Leave management", detail: "Requests, balances, and approvals", href: "/leave", type: "Module" },
    { id: "module-payroll", name: "Payroll", detail: "Salary runs and payslips", href: "/payroll", type: "Module" },
    { id: "module-recruitment", name: "Recruitment", detail: "Job posts and candidate pipeline", href: "/recruitment", type: "Module" },
    { id: "module-performance", name: "Performance", detail: "Goals and review cycles", href: "/performance", type: "Module" },
    { id: "module-documents", name: "Documents", detail: "Employee files and policies", href: "/documents", type: "Module" },
    { id: "module-reports", name: "Reports & analytics", detail: "Export workforce reports", href: "/reports", type: "Module" },
    { id: "module-audit", name: "Audit logs", detail: "Security and change history", href: "/audit", type: "Module" },
    { id: "module-settings", name: "Settings", detail: "Workspace preferences and access", href: "/settings", type: "Module" },
  ].filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(q.toLowerCase()));
  return [...people.map((person) => ({ ...person, href: "/employees" })), ...modules].slice(0, 10);
}

export async function getRecentAuditCount() {
  const [row] = await db.select({ total: count() }).from(auditLogs).where(gte(auditLogs.createdAt, sql`now() - interval '7 days'`));
  return Number(row.total);
}
