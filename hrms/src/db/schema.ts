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

export type Role = (typeof roleEnum.enumValues)[number];
export type EmployeeStatus = (typeof employeeStatusEnum.enumValues)[number];
export type LeaveStatus = (typeof leaveStatusEnum.enumValues)[number];
