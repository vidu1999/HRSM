import Link from "next/link";
import { Avatar, Button, Card, EmptyState, PageHeader, StatusBadge, inputClass } from "@/components/ui";
import { EmployeeForm } from "@/components/employee-form";
import { EmployeeStatusButton } from "@/components/employee-status-button";
import { formatDate, formatLkr, initials } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listDepartments, listEmployees } from "@/lib/services/employees";
import { employeeQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireSession();
  const sp = await searchParams;
  const query = employeeQuerySchema.parse(Object.fromEntries(Object.entries(sp).filter(([, v]) => v)));

  const [result, departments, directory] = await Promise.all([
    listEmployees(session, query),
    listDepartments(),
    listEmployees(session, { page: 1, pageSize: 100 }),
  ]);
  const canWrite = can(session, "employees:write");
  const canSeeSalary = can(session, "salary:read");

  const pageHref = (page: number) => {
    const p = new URLSearchParams();
    if (query.search) p.set("search", query.search);
    if (query.departmentId) p.set("departmentId", query.departmentId);
    if (query.status) p.set("status", query.status);
    p.set("page", String(page));
    return `/employees?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${result.total} ${result.total === 1 ? "person" : "people"} in your scope`}
      />

      <div className="space-y-6">
        {canWrite && (
          <Card title="Add employee" subtitle="Creates a new employee record with an auto-generated number">
            <EmployeeForm
              departments={departments.map((d) => ({ id: d.id, label: `${d.name} (${d.code})` }))}
              managers={directory.data.map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName} — ${m.jobTitle}` }))}
            />
          </Card>
        )}

        <Card>
          <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]" method="get">
            <input name="search" defaultValue={query.search} placeholder="Search name, email, number or title…" className={inputClass} />
            <select name="departmentId" defaultValue={query.departmentId ?? ""} className={inputClass}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={query.status ?? ""} className={inputClass}>
              <option value="">Any status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On leave</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
          </form>

          {result.data.length === 0 ? (
            <EmptyState>No employees match these filters.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Joined</th>
                    {canSeeSalary && <th className="py-2 pr-4 text-right">Base salary</th>}
                    <th className="py-2 pr-4">Status</th>
                    {canWrite && <th className="py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((e) => (
                    <tr key={e.id} className="transition hover:bg-slate-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar text={initials(e.firstName, e.lastName)} />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800">{e.firstName} {e.lastName}</div>
                            <div className="truncate text-xs text-slate-500">{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{e.employeeNumber}</td>
                      <td className="py-3 pr-4 text-slate-600">{e.departmentName}</td>
                      <td className="py-3 pr-4 text-slate-600">{e.jobTitle}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(e.joinDate)}</td>
                      {canSeeSalary && <td className="py-3 pr-4 text-right tabular-nums text-slate-700">{formatLkr(e.baseSalaryLkr ?? 0)}</td>}
                      <td className="py-3 pr-4"><StatusBadge status={e.status} /></td>
                      {canWrite && (
                        <td className="py-3 text-right">
                          <EmployeeStatusButton id={e.id} status={e.status} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <nav className="mt-4 flex items-center justify-between text-sm text-slate-600" aria-label="Pagination">
            <span>Page {result.page} of {result.totalPages}</span>
            <div className="flex gap-2">
              {result.page > 1 && <Link className="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50" href={pageHref(result.page - 1)}>Previous</Link>}
              {result.page < result.totalPages && <Link className="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50" href={pageHref(result.page + 1)}>Next</Link>}
            </div>
          </nav>
        </Card>
      </div>
    </>
  );
}
