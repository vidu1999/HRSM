import Link from "next/link";
import { Icon } from "@/components/icon";
import { AddEmployeeButton } from "@/components/module-actions";
import { Avatar, PageHeading, SearchField, StatusPill } from "@/components/presentation";
import { EmployeeStatusButton } from "@/components/employee-status-button";
import { formatDate, formatLkr } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listDepartments, listEmployees } from "@/lib/services/employees";
import { employeeQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
type SearchParams = Record<string, string | undefined>;

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireSession();
  const params = await searchParams;
  const query = employeeQuerySchema.parse(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));
  const [result, departments, directory] = await Promise.all([
    listEmployees(session, query),
    listDepartments(),
    listEmployees(session, { page: 1, pageSize: 100 }),
  ]);
  const canWrite = can(session, "employees:write");
  const canSeeSalary = can(session, "salary:read");
  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    if (query.search) next.set("search", query.search);
    if (query.departmentId) next.set("departmentId", query.departmentId);
    if (query.status) next.set("status", query.status);
    next.set("page", String(page));
    return `/employees?${next.toString()}`;
  };

  return <>
    <PageHeading title="Employees" description={`People directory · ${result.total} employee${result.total === 1 ? "" : "s"} in your scope`} action={<>{canWrite && <AddEmployeeButton departments={departments.map((department) => ({ id: department.id, label: `${department.name} (${department.code})` }))} managers={directory.data.map((employee) => ({ id: employee.id, label: `${employee.firstName} ${employee.lastName} — ${employee.jobTitle}` }))} />}<a className="button-secondary" href="/api/reports?type=employees"><Icon name="download" size={13} /> Export</a></>} />

    <form method="get" className="filter-toolbar">
      <SearchField name="search" placeholder="Search by name, employee ID, email..." defaultValue={query.search ?? ""} />
      <select className="filter-select" name="departmentId" defaultValue={query.departmentId ?? ""} aria-label="Filter by department"><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
      <select className="filter-select" name="status" defaultValue={query.status ?? ""} aria-label="Filter by status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="ON_LEAVE">On leave</option><option value="INACTIVE">Inactive</option><option value="TERMINATED">Terminated</option></select>
      <button className="button-secondary" type="submit"><Icon name="filter" size={13} /> Apply filters</button>
      <span className="toolbar-spacer" />
      <span className="toolbar-caption">Showing {result.data.length ? (result.page - 1) * result.pageSize + 1 : 0}–{Math.min(result.page * result.pageSize, result.total)} of {result.total}</span>
    </form>

    <section className="panel table-panel">
      <header className="panel-header"><div><h2>All employees</h2><p>Employee profiles, roles and organization assignments</p></div><div className="panel-meta"><span className="status-badge">{result.total} active profiles</span></div></header>
      <div className="table-wrap"><table className="data-table employee-table">
        <thead><tr><th>Employee ID</th><th>Name</th><th>Department</th><th>Position</th>{canSeeSalary && <th>Base salary</th>}<th>Status</th><th>Actions</th></tr></thead>
        <tbody>{result.data.length === 0 ? <tr><td className="empty-cell" colSpan={canSeeSalary ? 7 : 6}>No employees match the selected filters.</td></tr> : result.data.map((employee, index) => <tr key={employee.id}>
          <td className="employee-number">{employee.employeeNumber}</td>
          <td><div className="table-person"><Avatar name={`${employee.firstName} ${employee.lastName}`} index={index} /><span className="person-cell-copy"><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.email}</small></span></div></td>
          <td>{employee.departmentName}</td><td>{employee.jobTitle}<small className="sub-cell">{employee.employmentType.replaceAll("_", " ").toLowerCase()}</small></td>
          {canSeeSalary && <td className="amount">{formatLkr(employee.baseSalaryLkr ?? 0)}</td>}
          <td><StatusPill status={employee.status} /></td><td><div className="action-menu">{canWrite ? <EmployeeStatusButton id={employee.id} status={employee.status} /> : <span className="muted-cell">—</span>}</div></td>
        </tr>)}</tbody>
      </table></div>
      <footer className="table-footer"><span>Page {result.page} of {result.totalPages}</span><div className="pagination"><Link aria-label="Previous page" className={result.page <= 1 ? "disabled" : ""} href={pageHref(Math.max(1, result.page - 1))}>‹</Link><button type="button" className="current" aria-current="page">{result.page}</button><Link aria-label="Next page" className={result.page >= result.totalPages ? "disabled" : ""} href={pageHref(Math.min(result.totalPages, result.page + 1))}>›</Link></div></footer>
    </section>
  </>;
}
