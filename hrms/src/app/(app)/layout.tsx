import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db, employees } from "@/db";
import { Sidebar } from "@/components/sidebar";
import { can } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [me] = session.employeeId
    ? await db
        .select({ first: employees.firstName, last: employees.lastName })
        .from(employees)
        .where(eq(employees.id, session.employeeId))
        .limit(1)
    : [];
  const name = me ? `${me.first} ${me.last}` : session.email;

  const items = [
    { href: "/", label: "Dashboard", icon: "◉" },
    { href: "/employees", label: "Employees", icon: "👥" },
    { href: "/leave", label: "Leave", icon: "🌴" },
    { href: "/attendance", label: "Attendance", icon: "⏱" },
    ...(can(session, "audit:read") ? [{ href: "/audit", label: "Audit Logs", icon: "📜" }] : []),
  ];

  return (
    <div className="lg:flex">
      <Sidebar items={items} user={{ name, role: ROLE_LABEL[session.role] }} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
