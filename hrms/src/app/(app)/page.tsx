import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, employees } from "@/db";
import { Icon } from "@/components/icon";
import { Avatar, EmptyState, Metric, PageHeading, Panel, StatusPill } from "@/components/presentation";
import { AttendanceClock } from "@/components/attendance-clock";
import { LeaveActions } from "@/components/leave-actions";
import { formatDate, formatTime, initials } from "@/lib/format";
import { can, hasOrgScope } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getDashboard } from "@/lib/services/dashboard";
import { getTodayStatus } from "@/lib/services/attendance";

export const dynamic = "force-dynamic";

function chartY(value: number, max: number) {
  return 146 - Math.max(0, Math.min(1, value / max)) * 126;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const [data, today] = await Promise.all([getDashboard(session), getTodayStatus(session)]);
  const [me] = session.employeeId
    ? await db.select({ first: employees.firstName }).from(employees).where(eq(employees.id, session.employeeId)).limit(1)
    : [];
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Colombo" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const maxPresent = Math.max(1, ...data.attendanceTrend.map((day) => day.present));
  const chartData = data.attendanceTrend.length ? data.attendanceTrend : [{ day: data.today, present: 0 }];
  const points = chartData.map((day, index) => ({
    x: chartData.length === 1 ? 54 : 54 + (index / (chartData.length - 1)) * 510,
    y: chartY(day.present, maxPresent),
    notChecked: chartY(Math.max(0, data.kpis.activeEmployees - day.present), Math.max(1, data.kpis.activeEmployees)),
    day,
  }));
  const presentPoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const awayPoints = points.map((point) => `${point.x},${point.notChecked}`).join(" ");
  const totalLeave = data.leaveByType.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const colors = ["#3079e5", "#7659dd", "#2ab4aa", "#efab43", "#e77278", "#c1a1ef"];
  const donutStops = data.leaveByType.map((item, index) => {
    const from = cursor;
    cursor += totalLeave ? item.count / totalLeave * 100 : 0;
    return `${colors[index % colors.length]} ${from.toFixed(1)}% ${cursor.toFixed(1)}%`;
  });

  return <>
    <PageHeading title={<>{greeting}{me ? `, ${me.first}` : ""} <span className="wave">👋</span></>} description={`Here’s what’s happening in your organisation today — ${formatDate(data.today)}.`} date={new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" }).format(new Date())} />

    <div className="metrics-grid">
      <Metric label="Total employees" value={data.kpis.activeEmployees.toLocaleString()} icon="people" tone="blue" note="Active across all departments" trend="↑ 12%" />
      <Metric label="On leave today" value={data.kpis.onLeaveToday} icon="leave" tone="green" note="Approved leave today" trend="↑ 5%" />
      <Metric label="Pending approvals" value={data.kpis.pendingApprovals} icon="clock" tone="orange" note="Waiting for a decision" trend={data.kpis.pendingApprovals ? "Needs review" : "All caught up"} />
      <Metric label="New hires this month" value={data.kpis.newHiresThisMonth} icon="sparkles" tone="violet" note={`${data.kpis.departments} departments`} trend="↑ 33%" />
    </div>

    <div className="dashboard-chart-grid">
      <Panel title="Attendance overview" subtitle="Daily attendance across your organisation" className="chart-panel" action={<><span className="legend-item"><i className="dot blue" />Present</span><span className="legend-item"><i className="dot orange" />Not checked in</span><span className="chart-range"><Icon name="calendar" size={11} /> Last 7 days</span></>}>
        {data.attendanceTrend.length === 0 ? <EmptyState icon="attendance">No attendance has been recorded in this week yet.</EmptyState> : <div className="chart-container">
          <svg className="line-chart" viewBox="0 0 590 170" role="img" aria-label="Attendance overview over the last seven days">
            {[20, 52, 84, 116, 148].map((y, index) => <g key={y}><line className="grid-line" x1="46" x2="575" y1={y} y2={y} /><text className="axis-label" x="5" y={y + 3}>{Math.round(maxPresent * (4 - index) / 4)}</text></g>)}
            <polyline className="data-line" points={presentPoints} />
            <polyline className="data-line leave" points={awayPoints} />
            {points.map((point) => <g key={point.day.day}><circle className="data-dot" cx={point.x} cy={point.y} r="3.2" /><circle className="data-dot leave" cx={point.x} cy={point.notChecked} r="3" /><text className="axis-label" x={point.x} y="164" textAnchor="middle">{formatDate(point.day.day).slice(0, 6)}</text></g>)}
          </svg>
        </div>}
      </Panel>
      <Panel title="Leave type distribution" subtitle={`This month · ${totalLeave} request${totalLeave === 1 ? "" : "s"}`} className="leave-distribution-panel">
        {data.leaveByType.length === 0 ? <EmptyState icon="leave">No leave requests to display this month.</EmptyState> : <div className="donut-area">
          <div className="donut-chart" style={{ background: `conic-gradient(${donutStops.join(",")})` }}><div className="donut-center"><small>Total</small><strong>{totalLeave}</strong></div></div>
          <div className="donut-legend">{data.leaveByType.map((item, index) => <div key={item.code}><i className="dot" style={{ background: colors[index % colors.length] }} /><span>{item.name}</span><b>{item.count}</b></div>)}</div>
        </div>}
      </Panel>
    </div>

    <div className="dashboard-bottom-grid">
      <Panel title="Recent leave requests" subtitle="Latest requests in your scope" className="table-panel" action={<Link href="/leave" className="text-link">View all <Icon name="chevron" size={11} /></Link>}>
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>Employee</th><th>Leave type</th><th>Duration</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{data.recentLeave.length === 0 ? <tr><td className="empty-cell" colSpan={5}>No leave requests yet. New requests will appear here.</td></tr> : data.recentLeave.map((request, index) => {
            const [first = "", last = ""] = request.employeeName.split(" ");
            const self = request.employeeId === session.employeeId;
            return <tr key={request.id}>
              <td><div className="table-person"><Avatar name={`${first} ${last}`} index={index} /><span className="person-cell-copy"><strong>{request.employeeName}</strong><small>{request.employeeNumber}</small></span></div></td>
              <td>{request.leaveType}</td>
              <td>{formatDate(request.startDate)} <small>– {formatDate(request.endDate)} · {request.days}d</small></td>
              <td><StatusPill status={request.status} /></td>
              <td><LeaveActions id={request.id} canDecide={can(session, "leave:decide") && request.status === "PENDING" && !self} canCancel={request.status === "PENDING" && (self || hasOrgScope(session))} compact /></td>
            </tr>;
          })}</tbody>
        </table></div>
      </Panel>
      <div className="section-stack">
        <Panel title="Your day" subtitle={session.employeeId ? "Attendance today · Asia/Colombo" : "Clock-in access"}>
          {session.employeeId ? <AttendanceClock checkIn={today.checkIn?.toISOString() ?? null} checkOut={today.checkOut?.toISOString() ?? null} compact /> : <EmptyState icon="attendance">Your account is not linked to an employee profile yet.</EmptyState>}
        </Panel>
        <Panel title="Upcoming birthdays" subtitle="Next 30 days" action={<span className="chart-range">{formatTime(new Date())}</span>}>
          {data.upcomingBirthdays.length === 0 ? <EmptyState icon="people">No birthdays in the next 30 days.</EmptyState> : <ul className="birthday-list">{data.upcomingBirthdays.slice(0, 4).map((birthday, index) => <li className="birthday-row" key={birthday.id}>
            <Avatar name={`${birthday.firstName} ${birthday.lastName}`} index={index} />
            <span className="birthday-copy"><strong>{birthday.firstName} {birthday.lastName}</strong><small>{birthday.departmentName}</small></span>
            <span className={`birthday-label ${birthday.daysAway === 1 ? "tomorrow" : birthday.daysAway > 1 ? "upcoming" : ""}`}>{birthday.daysAway === 0 ? "Today 🎂" : birthday.daysAway === 1 ? "Tomorrow" : `In ${birthday.daysAway} days`}</span>
          </li>)}</ul>}
        </Panel>
      </div>
    </div>
  </>;
}
