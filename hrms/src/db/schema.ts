import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]);
export const employeeStatusEnum = pgEnum("employee_status", [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "TERMINATED",
]);
export const employmentTypeEnum = pgEnum("employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]);
export const leaveStatusEnum = pgEnum("leave_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("departments_code_uq").on(t.code)],
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeNumber: varchar("employee_number", { length: 20 }).notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    birthDate: date("birth_date"),
    jobTitle: varchar("job_title", { length: 120 }).notNull(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id),
    managerId: uuid("manager_id").references((): any => employees.id),
    employmentType: employmentTypeEnum("employment_type").notNull().default("FULL_TIME"),
    status: employeeStatusEnum("status").notNull().default("ACTIVE"),
    joinDate: date("join_date").notNull(),
    // Salary is sensitive: only HR_ADMIN / SUPER_ADMIN may read it (enforced in the API layer).
    baseSalaryLkr: integer("base_salary_lkr").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("employees_number_uq").on(t.employeeNumber),
    uniqueIndex("employees_email_uq").on(t.email),
    index("employees_department_idx").on(t.departmentId),
    index("employees_manager_idx").on(t.managerId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("EMPLOYEE"),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    annualAllowance: integer("annual_allowance").notNull(),
    isPaid: boolean("is_paid").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("leave_types_code_uq").on(t.code)],
);

export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id),
    year: integer("year").notNull(),
    allocated: integer("allocated").notNull(),
    used: integer("used").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("leave_balances_uq").on(t.employeeId, t.leaveTypeId, t.year)],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    days: integer("days").notNull(),
    reason: text("reason"),
    status: leaveStatusEnum("status").notNull().default("PENDING"),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    ...timestamps,
  },
  (t) => [
    index("leave_requests_employee_idx").on(t.employeeId, t.status),
    index("leave_requests_status_idx").on(t.status, t.startDate),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    workDate: date("work_date").notNull(),
    checkIn: timestamp("check_in", { withTimezone: true }),
    checkOut: timestamp("check_out", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("attendance_employee_day_uq").on(t.employeeId, t.workDate)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 60 }),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    ipAddress: varchar("ip_address", { length: 60 }),
    userAgent: varchar("user_agent", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt), index("audit_logs_entity_idx").on(t.entityType, t.entityId)],
);

export const payrollPeriods = pgTable(
  "payroll_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    period: varchar("period", { length: 7 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("PROCESSED"),
    employeeCount: integer("employee_count").notNull().default(0),
    grossLkr: integer("gross_lkr").notNull().default(0),
    deductionsLkr: integer("deductions_lkr").notNull().default(0),
    netLkr: integer("net_lkr").notNull().default(0),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("payroll_periods_period_uq").on(t.period)],
);

export const payrollItems = pgTable(
  "payroll_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    payrollPeriodId: uuid("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    baseLkr: integer("base_lkr").notNull(),
    allowanceLkr: integer("allowance_lkr").notNull().default(0),
    overtimeLkr: integer("overtime_lkr").notNull().default(0),
    deductionsLkr: integer("deductions_lkr").notNull().default(0),
    netLkr: integer("net_lkr").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("payroll_items_period_employee_uq").on(t.payrollPeriodId, t.employeeId), index("payroll_items_employee_idx").on(t.employeeId)],
);

export const jobPosts = pgTable(
  "job_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 140 }).notNull(),
    departmentId: uuid("department_id").notNull().references(() => departments.id),
    employmentType: varchar("employment_type", { length: 40 }).notNull().default("FULL_TIME"),
    location: varchar("location", { length: 120 }).notNull().default("Colombo, Sri Lanka"),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("OPEN"),
    postedAt: date("posted_at").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("job_posts_status_idx").on(t.status, t.postedAt)],
);

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    source: varchar("source", { length: 60 }).notNull().default("Direct"),
    ...timestamps,
  },
  (t) => [uniqueIndex("candidates_email_uq").on(t.email)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobPostId: uuid("job_post_id").notNull().references(() => jobPosts.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
    stage: varchar("stage", { length: 40 }).notNull().default("APPLIED"),
    appliedAt: date("applied_at").notNull(),
    interviewAt: timestamp("interview_at", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [uniqueIndex("applications_job_candidate_uq").on(t.jobPostId, t.candidateId), index("applications_stage_idx").on(t.stage)],
);

export const performanceGoals = pgTable(
  "performance_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    category: varchar("category", { length: 60 }).notNull().default("Individual goal"),
    description: text("description"),
    progress: integer("progress").notNull().default(0),
    status: varchar("status", { length: 30 }).notNull().default("ON_TRACK"),
    dueDate: date("due_date"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("performance_goals_employee_idx").on(t.employeeId, t.status)],
);

export const performanceReviews = pgTable(
  "performance_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 40 }).notNull(),
    rating: integer("rating").notNull().default(0),
    status: varchar("status", { length: 30 }).notNull().default("DRAFT"),
    summary: text("summary"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("performance_reviews_employee_period_uq").on(t.employeeId, t.period)],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull().default("application/octet-stream"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    contentBase64: text("content_base64"),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("documents_category_idx").on(t.category, t.createdAt)],
);

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    message: varchar("message", { length: 300 }).notNull(),
    href: varchar("href", { length: 240 }).notNull().default("/"),
    kind: varchar("kind", { length: 30 }).notNull().default("info"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_user_unread_idx").on(t.userId, t.isRead, t.createdAt)],
);

export type Role = (typeof roleEnum.enumValues)[number];
export type EmployeeStatus = (typeof employeeStatusEnum.enumValues)[number];
export type LeaveStatus = (typeof leaveStatusEnum.enumValues)[number];
