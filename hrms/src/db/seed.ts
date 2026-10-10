/**
 * Development seed: wipes business data and loads realistic demo records.
 * Refuses to run in production unless SEED_FORCE=1 is set.
 */
import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import { db, pool } from "./index";
import {
  attendanceRecords,
  auditLogs,
  departments,
  employees,
  leaveBalances,
  leaveRequests,
  leaveTypes,
  users,
} from "./schema";

const DEMO_PASSWORD = "Password123!";
const YEAR = new Date().getUTCFullYear();

type Seed = {
  key: string; // employee number, used for manager links
  first: string;
  last: string;
  title: string;
  dept: string;
  manager?: string;
  salary: number;
  joined: string;
  birth?: string;
  type?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
};

const DEPARTMENTS = [
  { code: "EXE", name: "Executive" },
  { code: "HR", name: "Human Resources" },
  { code: "ENG", name: "Engineering" },
  { code: "FIN", name: "Finance" },
  { code: "SAL", name: "Sales & Marketing" },
  { code: "OPS", name: "Operations" },
];

const LEAVE_TYPES = [
  { code: "ANNUAL", name: "Annual Leave", annualAllowance: 14, isPaid: true },
  { code: "CASUAL", name: "Casual Leave", annualAllowance: 7, isPaid: true },
  { code: "SICK", name: "Sick Leave", annualAllowance: 21, isPaid: true },
  { code: "MATERNITY", name: "Maternity Leave", annualAllowance: 84, isPaid: true },
];

const EMPLOYEES: Seed[] = [
  { key: "EMP-1001", first: "Sarah", last: "Fernando", title: "HR Director", dept: "HR", salary: 380000, joined: "2019-03-01", birth: "1984-10-10" },
  { key: "EMP-1002", first: "Ravindu", last: "Jayasinghe", title: "Chief Executive Officer", dept: "EXE", salary: 650000, joined: "2017-01-15", birth: "1979-05-22" },
  { key: "EMP-1003", first: "Dilshan", last: "Fernando", title: "Engineering Manager", dept: "ENG", manager: "EMP-1002", salary: 340000, joined: "2020-06-01", birth: "1988-10-13" },
  { key: "EMP-1004", first: "Kasun", last: "Perera", title: "Senior Software Engineer", dept: "ENG", manager: "EMP-1003", salary: 265000, joined: "2021-02-08", birth: "1992-10-10" },
  { key: "EMP-1005", first: "Sadeew", last: "Wijesinghe", title: "Software Engineer", dept: "ENG", manager: "EMP-1003", salary: 185000, joined: "2023-07-03", birth: "1997-10-11" },
  { key: "EMP-1006", first: "Ayesha", last: "Perera", title: "QA Engineer", dept: "ENG", manager: "EMP-1003", salary: 170000, joined: "2022-11-14", birth: "1995-03-02" },
  { key: "EMP-1007", first: "Nimal", last: "Silva", title: "DevOps Engineer", dept: "ENG", manager: "EMP-1003", salary: 230000, joined: "2021-09-20", birth: "1990-07-18" },
  { key: "EMP-1008", first: "Tharushi", last: "Fernando", title: "Frontend Developer", dept: "ENG", manager: "EMP-1003", salary: 195000, joined: "2024-01-08", birth: "1999-11-05" },
  { key: "EMP-1009", first: "Chamara", last: "Bandara", title: "Finance Manager", dept: "FIN", manager: "EMP-1002", salary: 320000, joined: "2018-08-27", birth: "1985-04-30" },
  { key: "EMP-1010", first: "Malini", last: "Rajapaksa", title: "Accountant", dept: "FIN", manager: "EMP-1009", salary: 160000, joined: "2022-05-16", birth: "1993-10-16" },
  { key: "EMP-1011", first: "Ishara", last: "Gunawardena", title: "Payroll Officer", dept: "FIN", manager: "EMP-1009", salary: 150000, joined: "2023-03-06", birth: "1996-08-09" },
  { key: "EMP-1012", first: "Roshan", last: "de Silva", title: "Sales Manager", dept: "SAL", manager: "EMP-1002", salary: 300000, joined: "2019-10-07", birth: "1986-10-24" },
  { key: "EMP-1013", first: "Dinuka", last: "Herath", title: "Account Executive", dept: "SAL", manager: "EMP-1012", salary: 140000, joined: "2024-04-22", birth: "1998-10-15" },
  { key: "EMP-1014", first: "Gayani", last: "Senanayake", title: "Marketing Specialist", dept: "SAL", manager: "EMP-1012", salary: 135000, joined: "2023-09-11", birth: "1997-02-14" },
  { key: "EMP-1015", first: "Lahiru", last: "Kumara", title: "Operations Manager", dept: "OPS", manager: "EMP-1002", salary: 290000, joined: "2018-02-19", birth: "1987-12-01" },
  { key: "EMP-1016", first: "Hasini", last: "Jayawardena", title: "Logistics Coordinator", dept: "OPS", manager: "EMP-1015", salary: 128000, joined: "2025-01-13", birth: "2000-10-27" },
  { key: "EMP-1017", first: "Pavithra", last: "Wickramasinghe", title: "HR Generalist", dept: "HR", manager: "EMP-1001", salary: 165000, joined: "2021-06-14", birth: "1994-10-29" },
  { key: "EMP-1018", first: "Anuradha", last: "Ekanayake", title: "Talent Acquisition Partner", dept: "HR", manager: "EMP-1001", salary: 175000, joined: "2026-10-02", birth: "1991-06-19" },
  { key: "EMP-1019", first: "Thilina", last: "Madushanka", title: "Junior Developer", dept: "ENG", manager: "EMP-1003", salary: 120000, joined: "2026-09-15", type: "INTERN", birth: "2002-10-19" },
  { key: "EMP-1020", first: "Dulani", last: "Weerasinghe", title: "Sales Associate", dept: "SAL", manager: "EMP-1012", salary: 110000, joined: "2025-08-04", type: "PART_TIME", birth: "1999-09-30" },
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    throw new Error("Refusing to seed demo data in production (set SEED_FORCE=1 to override)");
  }

  console.log("Clearing existing data...");
  await db.execute(sql`TRUNCATE audit_logs, attendance_records, leave_requests, leave_balances, users, employees, leave_types, departments RESTART IDENTITY CASCADE`);

  const deptIds = new Map<string, string>();
  for (const d of await db.insert(departments).values(DEPARTMENTS).returning()) deptIds.set(d.code, d.id);

  const typeRows = await db.insert(leaveTypes).values(LEAVE_TYPES).returning();
  const typeIds = new Map(typeRows.map((t) => [t.code, t.id]));

  const employeeIds = new Map<string, string>();
  // Insert managers first so manager foreign keys resolve in one pass per level.
  const pending = [...EMPLOYEES];
  while (pending.length) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const e = pending[i];
      if (e.manager && !employeeIds.has(e.manager)) continue;
      const [row] = await db
        .insert(employees)
        .values({
          employeeNumber: e.key,
          firstName: e.first,
          lastName: e.last,
          email: `${e.first}.${e.last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@hrms.example",
          birthDate: e.birth ?? null,
          jobTitle: e.title,
          departmentId: deptIds.get(e.dept)!,
          managerId: e.manager ? employeeIds.get(e.manager)! : null,
          employmentType: e.type ?? "FULL_TIME",
          status: "ACTIVE",
          joinDate: e.joined,
          baseSalaryLkr: e.salary,
          phone: "+94 77 000 " + e.key.slice(-4),
        })
        .returning({ id: employees.id });
      employeeIds.set(e.key, row.id);
      pending.splice(i, 1);
    }
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const e = (key: string) => employeeIds.get(key)!;
  await db.insert(users).values([
    { email: "admin@hrms.example", passwordHash, role: "SUPER_ADMIN", employeeId: e("EMP-1002") },
    { email: "hr@hrms.example", passwordHash, role: "HR_ADMIN", employeeId: e("EMP-1001") },
    { email: "manager@hrms.example", passwordHash, role: "MANAGER", employeeId: e("EMP-1003") },
    { email: "employee@hrms.example", passwordHash, role: "EMPLOYEE", employeeId: e("EMP-1004") },
  ]);

  // Balances for every employee/type this year, with some usage.
  const balanceRows: (typeof leaveBalances.$inferInsert)[] = [];
  for (const [key, id] of employeeIds) {
    for (const t of LEAVE_TYPES) {
      const used = t.code === "ANNUAL" ? (key.charCodeAt(key.length - 1) % 5) + 1 : t.code === "SICK" ? 2 : 0;
      balanceRows.push({ employeeId: id, leaveTypeId: typeIds.get(t.code)!, year: YEAR, allocated: t.annualAllowance, used });
    }
  }
  await db.insert(leaveBalances).values(balanceRows);

  // Sample leave requests across statuses, relative to the current year.
  const d = (m: number, day: number) => `${YEAR}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const leaveSeed = [
    { emp: "EMP-1004", type: "ANNUAL", start: d(10, 13), end: d(10, 15), days: 3, status: "PENDING", reason: "Family trip" },
    { emp: "EMP-1007", type: "SICK", start: d(10, 9), end: d(10, 10), days: 2, status: "APPROVED", reason: "Flu" },
    { emp: "EMP-1008", type: "CASUAL", start: d(10, 12), end: d(10, 12), days: 1, status: "PENDING", reason: "Bank errand" },
    { emp: "EMP-1005", type: "ANNUAL", start: d(10, 8), end: d(10, 9), days: 2, status: "APPROVED", reason: null },
    { emp: "EMP-1013", type: "ANNUAL", start: d(10, 26), end: d(10, 27), days: 2, status: "PENDING", reason: "Personal" },
    { emp: "EMP-1016", type: "CASUAL", start: d(10, 14), end: d(10, 14), days: 1, status: "PENDING", reason: null },
  ] as const;
  for (const l of leaveSeed) {
    await db.insert(leaveRequests).values({
      employeeId: e(l.emp),
      leaveTypeId: typeIds.get(l.type)!,
      startDate: l.start,
      endDate: l.end,
      days: l.days,
      status: l.status,
      reason: l.reason,
      decidedAt: l.status === "APPROVED" ? new Date() : null,
      decidedByUserId: null,
    });
  }

  // Attendance for the last five days for everyone except the people on leave.
  const today = new Date();
  for (let back = 1; back <= 5; back++) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - back);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    const workDate = day.toISOString().slice(0, 10);
    const rows = [...employeeIds.entries()]
      .filter(([, id]) => id)
      .map(([, employeeId], idx) => {
        if (idx % 9 === 0) return null; // a few absences
        const inMin = 8 * 60 + 30 + (idx % 4) * 7;
        const checkIn = new Date(`${workDate}T00:00:00+05:30`);
        checkIn.setMinutes(inMin);
        const checkOut = new Date(checkIn.getTime() + (8 * 60 + 15 + (idx % 3) * 20) * 60_000);
        return { employeeId, workDate, checkIn, checkOut };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length) await db.insert(attendanceRecords).values(rows);
  }

  await db.insert(auditLogs).values({
    actorEmail: "system@hrms.example",
    action: "SEED_LOADED",
    entityType: "system",
    entityId: null,
    newValue: { employees: EMPLOYEES.length, year: YEAR },
  });

  console.log(`Seeded ${EMPLOYEES.length} employees, ${DEPARTMENTS.length} departments, ${LEAVE_TYPES.length} leave types.`);
  console.log(`Demo logins (password "${DEMO_PASSWORD}"):`);
  console.log("  admin@hrms.example     SUPER_ADMIN");
  console.log("  hr@hrms.example        HR_ADMIN");
  console.log("  manager@hrms.example   MANAGER (Engineering)");
  console.log("  employee@hrms.example  EMPLOYEE");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
