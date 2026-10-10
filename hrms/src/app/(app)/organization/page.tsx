import Link from "next/link";
import { Icon } from "@/components/icon";
import { AddDepartmentButton } from "@/components/module-actions";
import { Metric, PageHeading } from "@/components/presentation";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listDepartments, listEmployees } from "@/lib/services/employees";
import { getRecruitmentSnapshot } from "@/lib/services/modules";

export const dynamic = "force-dynamic";

const DEPT_ICONS = ["organization", "people", "chart", "wallet", "reports", "attendance"] as const;

export default async function OrganizationPage() {
  const session = await requireSession();
  const [departments, people, recruitment] = await Promise.all([
    listDepartments(),
    listEmployees(session, { page: 1, pageSize: 100 }),
    can(session, "recruitment:read") ? getRecruitmentSnapshot() : Promise.resolve(null),
  ]);
  const head = people.data.find((employee) => /chief|director/i.test(employee.jobTitle)) ?? people.data[0];
  const totalHeadcount = departments.reduce((sum, department) => sum + department.headcount, 0);

  return <>
    <PageHeading title="Organization" description="Explore your company structure, departments and reporting lines." action={can(session, "departments:write") ? <AddDepartmentButton /> : undefined} />
    <div className="metrics-grid">
      <Metric label="Employees in scope" value={people.total.toLocaleString()} icon="people" tone="blue" note="Based on your access" />
      <Metric label="Departments" value={departments.length} icon="organization" tone="green" note="Active company teams" />
      <Metric label="Reporting lines" value={people.data.filter((employee) => employee.managerId).length} icon="chart" tone="violet" note="Profiles with a manager" />
      <Metric label="Open roles" value={recruitment?.stats.openJobs ?? "—"} icon="recruitment" tone="orange" note={recruitment ? "Published job openings" : "Recruitment access is restricted"} />
    </div>

    <section className="org-summary">
      <div className="org-lead-wrap">
        {head ? <div className="org-lead"><span className="org-avatar">{head.firstName[0]}{head.lastName[0]}</span><span><strong>{head.firstName} {head.lastName}</strong><small>{head.jobTitle} · {head.departmentName}</small></span><span className="user-role-chip">Leadership</span></div> : <div className="org-lead"><span className="org-avatar">H</span><span><strong>HRMS Workspace</strong><small>Organization root</small></span></div>}
        <div className="org-connector" />
      </div>
      <div className="org-department-grid">{departments.map((department, index) => {
        const leader = people.data.find((employee) => employee.departmentId === department.id && /manager|director|lead/i.test(employee.jobTitle)) ?? people.data.find((employee) => employee.departmentId === department.id);
        return <Link className="department-card" href={`/employees?departmentId=${department.id}`} key={department.id}>
          <span className={`department-icon dept-${index % 6}`}><Icon name={DEPT_ICONS[index % DEPT_ICONS.length]} /></span>
          <span><strong>{department.name}</strong><small>{leader ? `${leader.firstName} ${leader.lastName} · ` : ""}{department.headcount} employee{department.headcount === 1 ? "" : "s"}</small></span>
          <span className="department-arrow"><Icon name="chevron" size={14} /></span>
        </Link>;
      })}</div>
      <p className="org-footnote">Showing <strong>{totalHeadcount.toLocaleString()} active employees</strong> across {departments.length} departments. Click a team to open its employee directory.</p>
    </section>

    <section className="panel table-panel module-section">
      <header className="panel-header"><div><h2>Reporting directory</h2><p>People and their current reporting manager</p></div></header>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Position</th><th>Department</th><th>Manager</th><th>Status</th></tr></thead><tbody>
        {people.data.slice(0, 10).map((employee, index) => {
          const manager = people.data.find((candidate) => candidate.id === employee.managerId);
          return <tr key={employee.id}><td><span className="table-person"><span className={`avatar avatar-${index % 8}`}>{employee.firstName[0]}{employee.lastName[0]}</span><span className="person-cell-copy"><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.employeeNumber}</small></span></span></td><td>{employee.jobTitle}</td><td>{employee.departmentName}</td><td>{manager ? `${manager.firstName} ${manager.lastName}` : <span className="muted-cell">Top-level</span>}</td><td><span className="status-badge">{employee.status.replaceAll("_", " ")}</span></td></tr>;
        })}
        {!people.data.length && <tr><td className="empty-cell" colSpan={5}>No reporting-line data is available for your current scope.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}
