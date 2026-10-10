import { Metric, PageHeading, SearchField, Panel, Avatar, StatusPill } from "@/components/presentation";
import { AttendanceClock } from "@/components/attendance-clock";
import { Icon } from "@/components/icon";
import { formatDate, formatTime } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { getTodayStatus, listAttendance } from "@/lib/services/attendance";
import { listEmployees } from "@/lib/services/employees";
import { isoDateAddDays, todayInAppZone } from "@/lib/workdays";
import { hasOrgScope } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type SearchParams = { from?: string; to?: string; search?: string };
function safeDate(value: string | undefined, fallback: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback; }
function fmtMinutes(minutes: number | null) { return minutes == null ? "—" : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`; }

export default async function AttendancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireSession();
  const params = await searchParams;
  const today = todayInAppZone();
  let from = safeDate(params.from, isoDateAddDays(today, -6));
  let to = safeDate(params.to, today);
  if (from > to) { from = isoDateAddDays(today, -6); to = today; }
  const [status, allRows, employees] = await Promise.all([
    getTodayStatus(session), listAttendance(session, from, to, 500), listEmployees(session, { page: 1, pageSize: 100 }),
  ]);
  const search = params.search?.trim().toLowerCase() ?? "";
  const rows = allRows.filter((row) => !search || `${row.employeeName} ${row.employeeNumber}`.toLowerCase().includes(search));
  const todayRows = allRows.filter((row) => row.workDate === today && row.checkIn);
  const present = todayRows.length;
  const late = todayRows.filter((row) => {
    const time = formatTime(row.checkIn);
    const [hour, minute] = time.split(":").map(Number);
    return hour > 9 || (hour === 9 && minute > 0);
  }).length;
  const worked = allRows.filter((row) => row.workedMinutes != null).reduce((sum, row) => sum + (row.workedMinutes ?? 0), 0);
  const exportHref = `/api/reports?type=attendance`;

  return <>
    <PageHeading title="Attendance" description={`${hasOrgScope(session) ? "Organization-wide" : "Your team"} attendance in the Asia/Colombo time zone.`} action={<a className="button-secondary" href={exportHref}><Icon name="download" size={13} /> Export report</a>} />
    <div className="attendance-summary">
      <Metric label="Present today" value={present} icon="check" tone="green" note="Checked in today" />
      <Metric label="Absent today" value={Math.max(0, employees.total - present)} icon="people" tone="blue" note="No check-in recorded" />
      <Metric label="Late arrivals" value={late} icon="clock" tone="orange" note="After 9:00 AM local time" />
      <Metric label="Hours recorded" value={`${Math.floor(worked / 60)}h`} icon="attendance" tone="violet" note="Selected date range" />
    </div>
    <div className="attendance-page-grid">
      <Panel title="Your attendance" subtitle={`Today · ${formatDate(status.workDate)}`} className="attendance-self-panel">
        {session.employeeId ? <AttendanceClock checkIn={status.checkIn?.toISOString() ?? null} checkOut={status.checkOut?.toISOString() ?? null} /> : <div className="module-empty">Your account is not linked to an employee profile.</div>}
      </Panel>
      <Panel title="Attendance records" subtitle={`${formatDate(from)} – ${formatDate(to)} · ${rows.length} record${rows.length === 1 ? "" : "s"}`} className="table-panel attendance-records-panel">
        <form method="get" className="table-search-row">
          <SearchField name="search" placeholder="Search employee..." defaultValue={params.search ?? ""} />
          <label className="date-range-button"><Icon name="calendar" size={12} /><input aria-label="From date" name="from" type="date" defaultValue={from} /></label>
          <span className="date-range-separator">to</span>
          <label className="date-range-button"><Icon name="calendar" size={12} /><input aria-label="To date" name="to" type="date" defaultValue={to} /></label>
          <button className="button-secondary" type="submit">Apply</button>
          <span className="toolbar-spacer" /><span className="toolbar-caption">{allRows.length} database rows</span>
        </form>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Check-in</th><th>Check-out</th><th>Worked</th><th>Status</th></tr></thead><tbody>
          {rows.length === 0 ? <tr><td className="empty-cell" colSpan={6}>No attendance records match this date range.</td></tr> : rows.map((row, index) => {
            const time = formatTime(row.checkIn);
            const [hour, minute] = time.split(":").map(Number);
            const isLate = hour > 9 || (hour === 9 && minute > 0);
            const statusLabel = !row.checkIn ? "ABSENT" : isLate ? "LATE" : row.workedMinutes != null && row.workedMinutes < 240 ? "HALF_DAY" : "PRESENT";
            return <tr key={row.id}><td className="nowrap">{formatDate(row.workDate)}</td><td><span className="table-person"><Avatar name={row.employeeName} index={index} /><span className="person-cell-copy"><strong>{row.employeeName}</strong><small>{row.employeeNumber}</small></span></span></td><td className="amount">{formatTime(row.checkIn)}</td><td className="amount">{formatTime(row.checkOut)}</td><td className="amount">{fmtMinutes(row.workedMinutes)}</td><td><StatusPill status={statusLabel} /></td></tr>;
          })}
        </tbody></table></div>
      </Panel>
    </div>
  </>;
}
