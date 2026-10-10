import Link from "next/link";
import { Card, EmptyState, PageHeader, StatusBadge, Avatar, inputClass } from "@/components/ui";
import { LeaveForm } from "@/components/leave-form";
import { LeaveActions } from "@/components/leave-actions";
import { formatDate, initials } from "@/lib/format";
import { can, hasOrgScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listLeaveRequests, getBalances } from "@/lib/services/leave";
import { leaveQuerySchema } from "@/lib/validation";
import { listEmployeeOptions } from "@/lib/services/employees";

export const dynamic = "force-dynamic";

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export default async function LeavePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  const sp = await searchParams;
  const query = leaveQuerySchema.parse({ ...sp, status: sp.status && sp.status !== "ALL" ? sp.status : undefined });
  const year = new Date().getUTCFullYear();

  const canRequestForOthers = session.role === "MANAGER" || hasOrgScope(session);
  const [requests, balances, options] = await Promise.all([
    listLeaveRequests(session, { status: query.status, limit: 50, offset: 0 }),
    session.employeeId ? getBalances(session.employeeId, year) : Promise.resolve([]),
    canRequestForOthers ? listEmployeeOptions(session) : Promise.resolve([]),
  ]);

  const leaveTypeOptions = balances.map((b) => ({ id: b.leaveTypeId, label: `${b.name} (${b.remaining} left)` }));
  const activeTab = sp.status ?? "ALL";

  return (
    <>
      <PageHeader title="Leave" description={`Requests, approvals and balances for ${year}`} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <Card title="My balances" subtitle={`Allocated, used and pending days — ${year}`}>
            {balances.length === 0 ? (
              <EmptyState>No balance available — your account is not linked to an employee.</EmptyState>
            ) : (
              <ul className="space-y-4">
                {balances.map((b) => {
                  const pct = b.allocated > 0 ? Math.min(100, ((b.used + b.pending) / b.allocated) * 100) : 0;
                  return (
                    <li key={b.leaveTypeId}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{b.name}</span>
                        <span className="tabular-nums text-slate-600">
                          <strong className="text-slate-900">{b.remaining}</strong> / {b.allocated} left
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{b.used} used · {b.pending} pending</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Request leave" subtitle="Weekends are excluded automatically">
            {leaveTypeOptions.length === 0 ? (
              <EmptyState>Link an employee profile to request leave.</EmptyState>
            ) : (
              <LeaveForm
                leaveTypes={leaveTypeOptions}
                defaultEmployeeId={session.employeeId ?? undefined}
                employees={canRequestForOthers ? options : undefined}
              />
            )}
          </Card>
        </div>

        <Card
          className="xl:col-span-2"
          title="Requests"
          subtitle={hasOrgScope(session) ? "All employees" : session.role === "MANAGER" ? "Your team" : "Your requests"}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={tab === "ALL" ? "/leave" : `/leave?status=${tab}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                  activeTab === tab ? "bg-brand-600 text-white ring-brand-600" : "text-slate-600 ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>

          {requests.length === 0 ? (
            <EmptyState>No leave requests for this filter.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Dates</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => {
                    const [first = "", last = ""] = r.employeeName.split(" ");
                    const isSelf = r.employeeId === session.employeeId;
                    const canDecide = can(session, "leave:decide") && !isSelf && r.status === "PENDING";
                    const canCancel = r.status === "PENDING" && (isSelf || hasOrgScope(session));
                    return (
                      <tr key={r.id} className="align-top transition hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Avatar text={initials(first, last)} />
                            <div>
                              <div className="font-medium text-slate-800">{r.employeeName}</div>
                              <div className="font-mono text-xs text-slate-500">{r.employeeNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{r.leaveType}</td>
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
                          {formatDate(r.startDate)} – {formatDate(r.endDate)}
                          <div className="text-xs text-slate-400">{r.days} working day{r.days === 1 ? "" : "s"}</div>
                        </td>
                        <td className="max-w-[14rem] py-3 pr-4 text-slate-600">
                          <div className="truncate">{r.reason ?? "—"}</div>
                          {r.decisionNote && <div className="truncate text-xs text-slate-400">Note: {r.decisionNote}</div>}
                        </td>
                        <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3 text-right">
                          <LeaveActions id={r.id} canDecide={canDecide} canCancel={canCancel} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
