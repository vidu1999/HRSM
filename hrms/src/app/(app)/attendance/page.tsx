import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui";
import { AttendanceClock } from "@/components/attendance-clock";
import { formatDate, formatTime, initials } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { getTodayStatus, listAttendance } from "@/lib/services/attendance";
import { hasOrgScope } from "@/lib/rbac";
import { isoDateAddDays, todayInAppZone } from "@/lib/workdays";

export const dynamic = "force-dynamic";

function fmtMinutes(m: number | null) {
  if (m == null) return "—";
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export default async function AttendancePage() {
  const session = await requireSession();
  const today = todayInAppZone();
  const from = isoDateAddDays(today, -6);
  const [status, rows] = await Promise.all([getTodayStatus(session), listAttendance(session, from, today, 200)]);

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`${hasOrgScope(session) ? "Organisation-wide" : "Your team"} records from ${formatDate(from)} to ${formatDate(today)} (Asia/Colombo)`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Today" subtitle={formatDate(status.workDate)} className="xl:col-span-1">
          {session.employeeId ? (
            <AttendanceClock checkIn={status.checkIn?.toISOString() ?? null} checkOut={status.checkOut?.toISOString() ?? null} />
          ) : (
            <EmptyState>Your account is not linked to an employee record.</EmptyState>
          )}
        </Card>

        <Card className="xl:col-span-2" title="Recent records" subtitle="Check-ins and check-outs, newest first">
          {rows.length === 0 ? (
            <EmptyState>No attendance recorded in this period.</EmptyState>
          ) : (
            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">In</th>
                    <th className="py-2 pr-4">Out</th>
                    <th className="py-2 text-right">Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const [first = "", last = ""] = r.employeeName.split(" ");
                    return (
                      <tr key={r.id} className="transition hover:bg-slate-50">
                        <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600">{formatDate(r.workDate)}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <Avatar text={initials(first, last)} />
                            <span className="text-slate-800">{r.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">{formatTime(r.checkIn)}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">{formatTime(r.checkOut)}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-700">{fmtMinutes(r.workedMinutes)}</td>
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
