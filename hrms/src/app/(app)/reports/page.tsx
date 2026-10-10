import { Icon } from "@/components/icon";
import { PageHeading, Panel } from "@/components/presentation";
import { formatLkr } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDashboard } from "@/lib/services/dashboard";
import { getPayrollSnapshot } from "@/lib/services/modules";
import { listDepartments } from "@/lib/services/employees";

export const dynamic = "force-dynamic";
const palette = ["#357be6", "#efa43e", "#2daf84", "#e76a72", "#7856d7", "#3872b7", "#9a75de", "#2da7a6"];

export default async function ReportsPage() {
  const session = await requireSession();
  if (!can(session, "reports:read")) redirect("/");
  const [dashboard, departments, payroll] = await Promise.all([getDashboard(session), listDepartments(), can(session, "payroll:read") ? getPayrollSnapshot() : Promise.resolve(null)]);
  const deptTotal = departments.reduce((sum, department) => sum + department.headcount, 0);
  let cursor = 0;
  const stops = departments.map((department, index) => {
    const from = cursor; cursor += deptTotal ? department.headcount / deptTotal * 100 : 0;
    return `${palette[index % palette.length]} ${from.toFixed(1)}% ${cursor.toFixed(1)}%`;
  });
  const maxHeadcount = Math.max(1, ...departments.map((department) => department.headcount));
  const reports = [
    { name: "Employee directory", description: `${dashboard.kpis.activeEmployees} active employee profiles`, type: "employees", icon: "people" as const, tone: "blue" },
    { name: "Attendance summary", description: "Check-in and check-out data", type: "attendance", icon: "attendance" as const, tone: "green" },
    { name: "Leave requests", description: `${dashboard.kpis.pendingApprovals} requests awaiting a decision`, type: "leave", icon: "leave" as const, tone: "orange" },
    ...(can(session, "payroll:read") ? [{ name: "Payroll preview", description: payroll?.latest ? `Latest period ${payroll.latest.period}` : "Generate a preview first", type: "payroll", icon: "payroll" as const, tone: "violet" }] : []),
  ];

  return <>
    <PageHeading title="Reports & analytics" description="Live workforce reporting, generated from HRMS records in PostgreSQL." action={<a className="button-secondary" href="/api/reports?type=employees"><Icon name="download" size={13} /> Export employee report</a>} />
    <section className="report-shortcuts">{reports.map((report) => <a className="report-shortcut" href={`/api/reports?type=${report.type}`} key={report.type}>
      <span className={`report-icon ${report.tone}`}><Icon name={report.icon} /></span><strong>{report.name}</strong><small>{report.description}</small><span className="shortcut-download"><Icon name="download" size={11} /> Download CSV</span>
    </a>)}</section>
    <div className="reports-charts">
      <Panel title="Employee distribution" subtitle={`Active workforce · ${deptTotal} employees`} className="report-chart-panel">
        {departments.length ? <div className="employee-distribution"><div className="report-donut" style={{ background: `conic-gradient(${stops.join(",")})` }}><div className="donut-center"><small>Employees</small><strong>{deptTotal}</strong></div></div><div className="report-legend">{departments.map((department, index) => <div key={department.id}><i className="dot" style={{ background: palette[index % palette.length] }} /><span>{department.name}</span><b>{department.headcount}</b></div>)}</div></div> : <div className="module-empty">Department data is not available.</div>}
      </Panel>
      <Panel title="Department headcount" subtitle="Active employees by department" className="report-chart-panel">
        {departments.length ? <div className="headcount-chart">{departments.map((department, index) => <div className="headcount-col" key={department.id}><b>{department.headcount}</b><i style={{ height: `${Math.max(4, department.headcount / maxHeadcount * 100)}%`, animationDelay: `${index * 50}ms` }} /><small>{department.code}</small></div>)}</div> : <div className="module-empty">No department data.</div>}
      </Panel>
    </div>
    <div className="reports-summary-grid module-section">
      <Panel title="Workforce snapshot" subtitle="Current live indicators"><div className="report-summary-list"><div><span>Active employees</span><strong>{dashboard.kpis.activeEmployees.toLocaleString()}</strong></div><div><span>Departments</span><strong>{dashboard.kpis.departments}</strong></div><div><span>Pending leave</span><strong>{dashboard.kpis.pendingApprovals}</strong></div><div><span>On leave today</span><strong>{dashboard.kpis.onLeaveToday}</strong></div>{payroll?.latest && <div><span>Latest payroll preview</span><strong>{formatLkr(payroll.latest.netLkr)}</strong></div>}</div></Panel>
      <Panel title="Reporting notes" subtitle="How these numbers are calculated"><ul className="report-notes"><li>Headcount excludes terminated staff.</li><li>Attendance exports include dates from the previous 12 months.</li><li>Leave days exclude weekends; approvals are auditable.</li><li>Payroll exports are illustrative gross-pay previews only.</li></ul></Panel>
    </div>
  </>;
}
