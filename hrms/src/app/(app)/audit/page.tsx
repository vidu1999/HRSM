import { redirect } from "next/navigation";
import { Icon } from "@/components/icon";
import { Avatar, PageHeading, SearchField } from "@/components/presentation";
import { formatDate, formatTime } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listAuditLogs } from "@/lib/services/audit";
import { auditQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function actionTone(action: string) {
  if (/CREATE|APPROVE|GENERATED|UPLOADED/i.test(action)) return "create";
  if (/DELETE|REJECT|DECLINE|CANCEL/i.test(action)) return "delete";
  if (/UPDATE|CHANGE|DECISION/i.test(action)) return "update";
  if (/LOGIN|LOGOUT/i.test(action)) return "login";
  return "";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  if (!can(session, "audit:read")) redirect("/");
  const params = await searchParams;
  const query = auditQuerySchema.parse(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));
  const rows = await listAuditLogs({ ...query, limit: 100, offset: 0 });
  const entityTypes = ["employee", "leave_request", "attendance", "department", "job_post", "application", "performance_goal", "document", "payroll_period", "setting", "user", "system"];

  return <>
    <PageHeading title="Audit logs" description="Append-only history of security events and HR-relevant changes." action={<a className="button-secondary" href="/api/reports?type=audit"><Icon name="download" size={13} /> Export logs</a>} />
    <form className="filter-toolbar" method="get">
      <SearchField name="action" placeholder="Search action, e.g. EMPLOYEE_CREATED" defaultValue={query.action ?? ""} />
      <select className="filter-select" name="entityType" defaultValue={query.entityType ?? ""} aria-label="Filter by entity"><option value="">All entities</option>{entityTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
      <button className="button-secondary" type="submit"><Icon name="filter" size={13} /> Apply filters</button><span className="toolbar-spacer" /><span className="toolbar-caption">{rows.length} entries · newest first</span>
    </form>
    <section className="panel table-panel">
      <header className="panel-header"><div><h2>Activity history</h2><p>Who changed what, and when · timestamps are shown in Asia/Colombo.</p></div><span className="status-badge info">Immutable trail</span></header>
      {!rows.length ? <div className="module-empty"><span><Icon name="audit" /></span><p>No audit entries match these filters.</p></div> : <div className="table-wrap"><table className="data-table audit-table"><thead><tr><th>Date & time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Change details</th><th>IP address</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}>
        <td className="nowrap">{formatDate(row.createdAt)}<small className="sub-cell">{formatTime(row.createdAt)}</small></td>
        <td><span className="table-person"><Avatar name={row.actorEmail ?? "System"} index={index} /><span className="person-cell-copy"><strong>{row.actorEmail?.split("@")[0] ?? "system"}</strong><small>{row.actorEmail ?? "Automated event"}</small></span></span></td>
        <td><span className={`audit-action ${actionTone(row.action)}`}>{row.action.replaceAll("_", " ")}</span></td>
        <td><span className="audit-entity">{row.entityType.replaceAll("_", " ")}</span>{row.entityId && <small className="sub-cell">{row.entityId.slice(0, 8)}…</small>}</td>
        <td><details className="audit-details"><summary>{row.oldValue || row.newValue ? "View change" : "No payload"}</summary><pre>{JSON.stringify({ before: row.oldValue, after: row.newValue }, null, 2)}</pre></details></td>
        <td className="muted-cell">{row.ipAddress ?? "—"}</td>
      </tr>)}</tbody></table></div>}
      <footer className="policy-footer"><span>Audit records are written transactionally alongside data changes.</span><span>Rows are read-only and cannot be edited.</span></footer>
    </section>
  </>;
}
