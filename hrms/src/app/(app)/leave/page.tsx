import Link from "next/link";
import { Icon } from "@/components/icon";
import { LeaveRequestButton } from "@/components/module-actions";
import { Avatar, EmptyState, Metric, PageHeading, Panel, StatusPill } from "@/components/presentation";
import { LeaveActions } from "@/components/leave-actions";
import { formatDate } from "@/lib/format";
import { can, hasOrgScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listLeaveRequests, getBalances } from "@/lib/services/leave";
import { listEmployeeOptions } from "@/lib/services/employees";
import { leaveQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

export default async function LeavePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  const params = await searchParams;
  const query = leaveQuerySchema.parse({ ...params, status: params.status && params.status !== "ALL" ? params.status : undefined, limit: 100 });
  const year = new Date().getFullYear();
  const canRequestForOthers = session.role === "MANAGER" || hasOrgScope(session);
  const [requests, allRequests, balances, employees] = await Promise.all([
    listLeaveRequests(session, { status: query.status, limit: query.limit, offset: 0 }),
    listLeaveRequests(session, { limit: 100, offset: 0 }),
    session.employeeId ? getBalances(session.employeeId, year) : Promise.resolve([]),
    canRequestForOthers ? listEmployeeOptions(session) : Promise.resolve([]),
  ]);
  const activeTab = params.status ?? "ALL";
  const pending = allRequests.filter((request) => request.status === "PENDING").length;
  const approved = allRequests.filter((request) => request.status === "APPROVED").length;
  const annual = balances.find((balance) => balance.code === "ANNUAL");
  const leaveTypes = balances.map((balance) => ({ id: balance.leaveTypeId, label: `${balance.name} · ${balance.remaining} day${balance.remaining === 1 ? "" : "s"} available` }));

  return <>
    <PageHeading title="Leave management" description={`Leave requests, approvals and balances · ${year}`} action={<><a href="/api/reports?type=leave" className="button-secondary"><Icon name="download" size={13} /> Export</a><LeaveRequestButton leaveTypes={leaveTypes} employees={canRequestForOthers ? employees : undefined} defaultEmployeeId={session.employeeId ?? undefined} /></>} />
    <div className="metrics-grid">
      <Metric label="Annual leave remaining" value={annual?.remaining ?? 0} icon="leave" tone="blue" note={`${annual?.allocated ?? 0} days allocated`} />
      <Metric label="Pending requests" value={pending} icon="clock" tone="orange" note="Awaiting a decision" />
      <Metric label="Approved this year" value={approved} icon="check" tone="green" note="Approved requests" />
      <Metric label="Leave types" value={balances.length} icon="calendar" tone="violet" note="Configured for your profile" />
    </div>

    <div className="leave-layout">
      <div className="leave-side-stack">
        <Panel title="My leave balances" subtitle={`Available days · ${year}`}>
          {balances.length === 0 ? <EmptyState icon="leave">Link an employee profile to see leave balances.</EmptyState> : <ul className="balance-list">{balances.map((balance, index) => {
            const usedPercent = balance.allocated ? Math.min(100, Math.round((balance.used + balance.pending) / balance.allocated * 100)) : 0;
            return <li className="balance-item" key={balance.leaveTypeId}><div className="balance-title"><strong>{balance.name}</strong><span>{balance.remaining} / {balance.allocated}</span></div><div className="balance-track"><span style={{ width: `${usedPercent}%`, background: index % 2 ? "linear-gradient(90deg,#20a77c,#62c4a0)" : undefined }} /></div><small>{balance.used} used · {balance.pending} pending · {balance.isPaid ? "Paid" : "Unpaid"}</small></li>;
          })}</ul>}
        </Panel>
        <Panel title="Approval flow" subtitle="Clear, auditable decisions">
          <div className="workflow-steps"><div><span>1</span><strong>Request</strong><small>Employee submits dates and reason</small></div><div><span>2</span><strong>Review</strong><small>Manager or HR decides</small></div><div><span>3</span><strong>Balance updated</strong><small>Approved days are recorded</small></div></div>
        </Panel>
      </div>
      <Panel title="Leave requests" subtitle={hasOrgScope(session) ? "Organization-wide requests" : session.role === "MANAGER" ? "Your team’s requests" : "Your personal requests"} className="table-panel">
        <div className="module-tabs">{TABS.map((tab) => <Link key={tab} href={tab === "ALL" ? "/leave" : `/leave?status=${tab}`} className={`module-tab${activeTab === tab ? " active" : ""}`}>{tab === "ALL" ? "All requests" : tab[0] + tab.slice(1).toLowerCase()}<span className="tab-count">{tab === "ALL" ? allRequests.length : allRequests.filter((request) => request.status === tab).length}</span></Link>)}</div>
        {requests.length === 0 ? <EmptyState icon="leave">No leave requests match this view.</EmptyState> : <div className="table-wrap leave-table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Leave type</th><th>Duration</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {requests.map((request, index) => {
            const [first = "", ...rest] = request.employeeName.split(" "); const last = rest.join(" "); const self = request.employeeId === session.employeeId;
            const canDecide = can(session, "leave:decide") && !self && request.status === "PENDING";
            const canCancel = request.status === "PENDING" && (self || hasOrgScope(session));
            return <tr key={request.id}><td><div className="table-person"><Avatar name={`${first} ${last}`} index={index} /><span className="person-cell-copy"><strong>{request.employeeName}</strong><small>{request.employeeNumber}</small></span></div></td><td>{request.leaveType}</td><td>{formatDate(request.startDate)}<small className="sub-cell">to {formatDate(request.endDate)} · {request.days} working day{request.days === 1 ? "" : "s"}</small></td><td className="description-cell" title={request.reason ?? "No reason provided"}>{request.reason ?? "—"}{request.decisionNote && <small className="sub-cell">Note: {request.decisionNote}</small>}</td><td><StatusPill status={request.status} /></td><td><LeaveActions id={request.id} canDecide={canDecide} canCancel={canCancel} /></td></tr>;
          })}
        </tbody></table></div>}
        <footer className="policy-footer"><span>Weekends are excluded from leave-day calculations.</span><span>Pending requests reserve days to prevent overbooking.</span></footer>
      </Panel>
    </div>
  </>;
}
