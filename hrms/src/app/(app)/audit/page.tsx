import { Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/format";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { listAuditLogs } from "@/lib/services/audit";
import { auditQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession();
  if (!can(session, "audit:read")) redirect("/");
  const sp = await searchParams;
  const q = auditQuerySchema.parse(Object.fromEntries(Object.entries(sp).filter(([, v]) => v)));
  const rows = await listAuditLogs({ ...q, limit: 100, offset: 0 });

  return (
    <>
      <PageHeader title="Audit logs" description="Append-only record of security and HR-relevant changes." />
      <Card>
        <form className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3" method="get">
          <select name="entityType" defaultValue={q.entityType ?? ""} className={inputClass}>
            <option value="">All entities</option>
            <option value="employee">Employee</option>
            <option value="leave_request">Leave request</option>
            <option value="attendance">Attendance</option>
            <option value="department">Department</option>
            <option value="user">User / login</option>
            <option value="system">System</option>
          </select>
          <input name="action" defaultValue={q.action} placeholder="Action, e.g. LEAVE_APPROVED" className={inputClass} />
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Apply filters</button>
        </form>

        {rows.length === 0 ? (
          <EmptyState>No audit entries match these filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Actor</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Entity</th>
                  <th className="py-2 pr-4">Change</th>
                  <th className="py-2">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">
                      {formatDate(r.createdAt)} <span className="text-slate-400">{formatTime(r.createdAt)}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{r.actorEmail ?? "system"}</td>
                    <td className="py-2.5 pr-4"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{r.action}</code></td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {r.entityType}
                      {r.entityId && <div className="font-mono text-[11px] text-slate-400">{r.entityId.slice(0, 8)}…</div>}
                    </td>
                    <td className="max-w-md py-2.5 pr-4">
                      <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                        {JSON.stringify({ old: r.oldValue, new: r.newValue }, null, 0)}
                      </pre>
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{r.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
