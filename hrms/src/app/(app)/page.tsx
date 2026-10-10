import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, employees } from "@/db";
import { Avatar, Card, EmptyState, Kpi, PageHeader, StatusBadge } from "@/components/ui";
import { AttendanceClock } from "@/components/attendance-clock";
import { LeaveActions } from "@/components/leave-actions";
import { formatDate, formatTime, initials } from "@/lib/format";
import { can, hasOrgScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getDashboard } from "@/lib/services/dashboard";
import { getTodayStatus } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const [data, today] = await Promise.all([getDashboard(session), getTodayStatus(session)]);
  const [me] = session.employeeId
    ? await db.select({ first: employees.firstName }).from(employees).where(eq(employees.id, session.employeeId)).limit(1)
    : [];
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Colombo" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const maxPresent = Math.max(1, ...data.attendanceTrend.map((d) => d.present));
  const totalLeave = data.leaveByType.reduce((sum, t) => sum + t.count, 0);
  const canDecide = can(session, "leave:decide");

  return (
    <>
      <PageHeader
        title={`${greeting}${me ? `, ${me.first}` : ""} 👋`}
        description={`Here's what's happening in your organisation today — ${formatDate(data.today)}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active employees" value={data.kpis.activeEmployees.toLocaleString()} hint="Excludes terminated staff" />
        <Kpi label="On leave today" value={data.kpis.onLeaveToday} tone="green" hint="Approved leave covering today" />
        <Kpi label="Pending approvals" value={data.kpis.pendingApprovals} tone="amber" hint="Awaiting a decision" />
        <Kpi label="New hires this month" value={data.kpis.newHiresThisMonth} tone="violet" hint={`${data.kpis.departments} departments`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Attendance — last 7 days" subtitle="Employees who checked in each day" className="xl:col-span-2">
          {data.attendanceTrend.length === 0 ? (
            <EmptyState>No attendance recorded this week yet.</EmptyState>
          ) : (
            <div className="flex h-48 items-end gap-3">
              {data.attendanceTrend.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium tabular-nums text-slate-600">{d.present}</span>
                  <div
                    className="w-full max-w-14 rounded-t-lg bg-gradient-to-t from-brand-600 to-blue-400 transition-all duration-500 hover:from-brand-700"
                    style={{ height: `${Math.round((d.present / maxPresent) * 100)}%` }}
                    title={`${d.present} present on ${formatDate(d.day)}`}
                  />
                  <span className="text-xs text-slate-500">{formatDate(d.day).slice(0, 6)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Check in" subtitle={session.employeeId ? "Your attendance today" : "Link an employee profile to clock in"}>
          {session.employeeId ? (
            <AttendanceClock checkIn={today.checkIn?.toISOString() ?? null} checkOut={today.checkOut?.toISOString() ?? null} />
          ) : (
            <EmptyState>Your account is not linked to an employee record.</EmptyState>
          )}
        </Card>

        <Card title="Leave by type" subtitle={`This month · ${totalLeave} request${totalLeave === 1 ? "" : "s"}`} className="xl:col-span-1">
          {data.leaveByType.length === 0 ? (
            <EmptyState>No leave requests this month.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {data.leaveByType.map((t) => (
                <li key={t.code}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">{t.name}</span>
                    <span className="font-medium tabular-nums">{t.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${(t.count / totalLeave) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent leave requests"
          subtitle="Latest requests in your scope"
          className="xl:col-span-2"
          action={<Link href="/leave" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>}
        >
          {data.recentLeave.length === 0 ? (
            <EmptyState>No leave requests yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Dates</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentLeave.map((r) => {
                    const [first = "", last = ""] = r.employeeName.split(" ");
                    const isSelf = r.employeeId === session.employeeId;
                    return (
                      <tr key={r.id} className="transition hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Avatar text={initials(first, last)} />
                            <span className="font-medium text-slate-800">{r.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{r.leaveType}</td>
                        <td className="py-3 pr-4 text-slate-600">
                          {formatDate(r.startDate)} – {formatDate(r.endDate)} <span className="text-slate-400">({r.days}d)</span>
                        </td>
                        <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3 text-right">
                          <LeaveActions
                            id={r.id}
                            canDecide={canDecide && r.status === "PENDING" && !isSelf}
                            canCancel={r.status === "PENDING" && (isSelf || hasOrgScope(session))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Upcoming birthdays" subtitle="Next 30 days" action={<span className="text-xs text-slate-400">{formatTime(new Date())}</span>}>
          {data.upcomingBirthdays.length === 0 ? (
            <EmptyState>No birthdays in the next 30 days.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingBirthdays.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <Avatar text={initials(b.firstName, b.lastName)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-800">{b.firstName} {b.lastName}</div>
                    <div className="truncate text-xs text-slate-500">{b.departmentName}</div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {b.daysAway === 0 ? "Today 🎂" : b.daysAway === 1 ? "Tomorrow" : `In ${b.daysAway} days`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
