import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format").refine(
  // Round-trip check rejects rollovers such as 2026-02-30.
  (v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
  "Invalid calendar date",
);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const employeeCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  birthDate: isoDate.optional().nullable(),
  jobTitle: z.string().trim().min(1).max(120),
  departmentId: z.uuid(),
  managerId: z.uuid().optional().nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
  joinDate: isoDate,
  baseSalaryLkr: z.number().int().min(0).max(100_000_000).default(0),
});

export const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
});

export const employeeQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  departmentId: z.uuid().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const leaveCreateSchema = z.object({
  employeeId: z.uuid().optional(),
  leaveTypeId: z.uuid(),
  startDate: isoDate,
  endDate: isoDate,
  reason: z.string().max(1000).optional(),
});

export const leaveDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});

export const leaveQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  employeeId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/, "Use 2-10 letters or digits"),
});

export const auditQuerySchema = z.object({
  entityType: z.string().max(60).optional(),
  action: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
