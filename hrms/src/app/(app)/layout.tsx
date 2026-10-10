import { and, count, eq, ne } from "drizzle-orm";
import type { ReactNode } from "react";
import { db, employees, leaveRequests } from "@/db";
import { AppShell, type NavItem } from "@/components/app-shell";
import { can, scopeFilter, visibleEmployeeIds } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listNotifications } from "@/lib/services/modules";

export const dynamic = "force-dynamic";

const ROLE_NAME = { SUPER_ADMIN: "Super Admin", HR_ADMIN: "HR Administrator", MANAGER: "Manager", EMPLOYEE: "Employee" } as const;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const [me, notices, scope] = await Promise.all([
    session.employeeId
      ? db.select({ first: employees.firstName, last: employees.lastName }).from(employees).where(eq(employees.id, session.employeeId)).limit(1)
      : Promise.resolve([]),
    listNotifications(session),
    visibleEmployeeIds(session),
  ]);
  const [activeRow] = await db.select({ total: count() }).from(employees).where(and(ne(employees.status, "TERMINATED"), scopeFilter(employees.id, scope)));
  const [pendingRow] = await db.select({ total: count() }).from(leaveRequests).where(and(eq(leaveRequests.status, "PENDING"), scopeFilter(leaveRequests.employeeId, scope)));
  const name = me[0] ? `${me[0].first} ${me[0].last}` : session.email;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/employees", label: "Employees", icon: "people", count: Number(activeRow.total) },
    { href: "/organization", label: "Organization", icon: "organization" },
    { href: "/attendance", label: "Attendance", icon: "attendance" },
    { href: "/leave", label: "Leave", icon: "leave", badge: Number(pendingRow.total) },
    ...(can(session, "payroll:read") ? [{ href: "/payroll", label: "Payroll", icon: "payroll" as const }] : []),
    ...(can(session, "recruitment:read") ? [{ href: "/recruitment", label: "Recruitment", icon: "recruitment" as const }] : []),
    { href: "/performance", label: "Performance", icon: "performance" },
    { href: "/documents", label: "Documents", icon: "documents" },
    ...(can(session, "reports:read") ? [{ href: "/reports", label: "Reports", icon: "reports" as const }] : []),
    ...(can(session, "audit:read") ? [{ href: "/audit", label: "Audit Logs", icon: "audit" as const }] : []),
    ...(can(session, "settings:read") ? [{ href: "/settings", label: "Settings", icon: "settings" as const }] : []),
  ];

  return <AppShell user={{ name, email: session.email, role: ROLE_NAME[session.role], initials: initials || "HR" }} items={items} notifications={notices}>{children}</AppShell>;
}
