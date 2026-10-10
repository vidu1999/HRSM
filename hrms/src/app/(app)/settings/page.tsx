import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db, employees, users } from "@/db";
import { Icon } from "@/components/icon";
import { PageHeading, Panel, StatusPill } from "@/components/presentation";
import { SettingsForm, UserRoleSelect } from "@/components/module-actions";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getApplicationSettings } from "@/lib/services/modules";

export const dynamic = "force-dynamic";
const TABS = ["general", "security", "roles", "system"] as const;
const LABELS = { general: "General", security: "Security", roles: "Roles & permissions", system: "System" } as const;
const ROLE_DETAILS = [
  { role: "SUPER_ADMIN", description: "Full platform access, role management and audit review" },
  { role: "HR_ADMIN", description: "Manage employee records, payroll, workflows and reporting" },
  { role: "MANAGER", description: "View their reporting tree and manage team approvals" },
  { role: "EMPLOYEE", description: "Access personal profile, attendance and leave" },
] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  if (!can(session, "settings:read")) redirect("/");
  const { view: rawView } = await searchParams;
  const view = TABS.includes(rawView as typeof TABS[number]) ? rawView as typeof TABS[number] : "general";
  const [settings, accounts] = await Promise.all([
    getApplicationSettings(),
    db.select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive, first: employees.firstName, last: employees.lastName }).from(users).leftJoin(employees, eq(employees.id, users.employeeId)).orderBy(asc(users.email)),
  ]);
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return <>
    <PageHeading title="Settings" description="Configure your organization, security policies, roles and system preferences." />
    <div className="module-tabs app-settings-tabs">{TABS.map((tab) => <Link className={`module-tab${view === tab ? " active" : ""}`} href={tab === "general" ? "/settings" : `/settings?view=${tab}`} key={tab}>{LABELS[tab]}</Link>)}</div>

    {view === "roles" ? <div className="settings-content">
      <Panel title="Role definitions" subtitle="Role-based permissions are enforced by the server on every route.">
        <div className="role-cards">{ROLE_DETAILS.map((item) => <article className="role-card" key={item.role}><span className="role-card-icon"><Icon name={item.role === "SUPER_ADMIN" ? "shield" : item.role === "HR_ADMIN" ? "people" : item.role === "MANAGER" ? "organization" : "person"} size={15} /></span><span><strong>{item.role.replaceAll("_", " ")}</strong><small>{item.description}</small></span><b>{accounts.filter((account) => account.role === item.role).length}</b></article>)}</div>
      </Panel>
      <Panel title="User access" subtitle="Assign one of the platform’s built-in access roles." className="module-section table-panel"><div className="table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Account state</th><th>Access</th></tr></thead><tbody>{accounts.map((account, index) => <tr key={account.id}><td><span className="table-person"><span className={`avatar avatar-${index % 8}`}>{(account.first?.[0] ?? account.email[0]).toUpperCase()}{(account.last?.[0] ?? "").toUpperCase()}</span><span className="person-cell-copy"><strong>{account.first && account.last ? `${account.first} ${account.last}` : account.email}</strong><small>{account.email}</small></span></span></td><td><UserRoleSelect id={account.id} role={account.role} disabled={!isSuperAdmin} /></td><td><StatusPill status={account.isActive ? "ACTIVE" : "INACTIVE"} /></td><td>{isSuperAdmin ? <span className="muted-cell">Editable</span> : <span className="muted-cell">View only</span>}</td></tr>)}</tbody></table></div><div className="policy-footer"><span>Only a super admin can change role assignments.</span><span>Every update is recorded in the audit log.</span></div></Panel>
    </div> : <div className="settings-content"><section className="settings-panel"><SettingsForm initial={settings} section={view === "general" ? "general" : view === "security" ? "security" : "system"} /></section></div>}
  </>;
}
