import Link from "next/link";
import { Icon } from "@/components/icon";
import { RunPayrollButton } from "@/components/module-actions";
import { PageHeading, Panel, Avatar, StatusPill } from "@/components/presentation";
import { formatDate, formatLkr } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getPayrollSnapshot } from "@/lib/services/modules";

export const dynamic = "force-dynamic";
const TABS = ["overview", "salary", "payslips", "deductions"] as const;
const TAB_LABELS = { overview: "Overview", salary: "Salary structure", payslips: "Payslips", deductions: "Deductions & benefits" } as const;

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  if (!can(session, "payroll:read")) redirect("/");
  const { view: rawView } = await searchParams;
  const view = TABS.includes(rawView as typeof TABS[number]) ? rawView as typeof TABS[number] : "overview";
  const data = await getPayrollSnapshot();
  const latest = data.latest;
  const totalAllowances = data.items.reduce((sum, item) => sum + item.allowanceLkr, 0);
  const totalDeductions = data.items.reduce((sum, item) => sum + item.deductionsLkr, 0);

  return <>
    <PageHeading title="Payroll" description="Salary records and auditable payroll previews. Statutory calculations are intentionally not inferred." action={<><a className="button-secondary" href="/api/reports?type=payroll"><Icon name="download" size={13} /> Export payroll</a><RunPayrollButton /></>} />
    <div className="module-tabs app-settings-tabs">{TABS.map((tab) => <Link className={`module-tab${view === tab ? " active" : ""}`} key={tab} href={tab === "overview" ? "/payroll" : `/payroll?view=${tab}`}>{TAB_LABELS[tab]}</Link>)}</div>

    <div className="payroll-content">
      <div className="payroll-stat-grid">
        <div className="payroll-stat"><span>Latest payroll period</span><strong>{latest?.period ?? "Not run"}</strong><small>{latest ? <StatusPill status={latest.status} /> : "Generate a preview"}</small></div>
        <div className="payroll-stat"><span>Active employees</span><strong>{data.activeCount.toLocaleString()}</strong><small>Included in a future run</small></div>
        <div className="payroll-stat"><span>Gross pay preview</span><strong>{latest ? formatLkr(latest.grossLkr) : "LKR 0"}</strong><small>Base + configured sample components</small></div>
        <div className="payroll-stat"><span>Deduction preview</span><strong>{formatLkr(totalDeductions)}</strong><small>Statutory deductions not calculated</small></div>
      </div>

      <div className="payroll-warning"><Icon name="shield" size={14} /><span><strong>Demo payroll safety:</strong> this workspace stores an auditable gross-pay preview only. It does not calculate EPF/ETF, tax, no-pay, statutory deductions, or initiate payments. Verify current rules before any production use.</span></div>

      {view === "overview" && <Panel title="Latest payroll preview" subtitle={latest ? `${latest.period} · ${latest.employeeCount} employees · created ${formatDate(latest.processedAt)}` : "Generate a period preview to see payroll data."} className="table-panel" action={latest && <a className="text-link" href={`/api/reports?type=payroll`}>Export CSV <Icon name="chevron" size={11} /></a>}>
        {!data.items.length ? <div className="module-empty"><span><Icon name="payroll" /></span><p>No payroll previews are stored yet. Generate a month to create the first database-backed preview.</p></div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Base salary</th><th>Allowances</th><th>Overtime</th><th>Net preview</th><th>Status</th></tr></thead><tbody>{data.items.map((item, index) => <tr key={item.id}><td><span className="table-person"><Avatar name={`${item.firstName} ${item.lastName}`} index={index} /><span className="person-cell-copy"><strong>{item.firstName} {item.lastName}</strong><small>{item.employeeNumber}</small></span></span></td><td>{item.department}</td><td className="amount">{formatLkr(item.baseLkr)}</td><td className="amount">{formatLkr(item.allowanceLkr)}</td><td className="amount">{formatLkr(item.overtimeLkr)}</td><td className="amount highlight-cell">{formatLkr(item.netLkr)}</td><td><StatusPill status="PROCESSED" /></td></tr>)}</tbody></table></div>}
      </Panel>}

      {view === "salary" && <Panel title="Salary structure" subtitle="Base salary and sample pay components from the latest stored payroll period." className="table-panel">
        {!data.items.length ? <div className="module-empty">No salary structure records are available yet.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Base salary / month</th><th>Allowance preview</th><th>Overtime preview</th><th>Total gross</th></tr></thead><tbody>{data.items.map((item, index) => <tr key={item.id}><td><span className="table-person"><Avatar name={`${item.firstName} ${item.lastName}`} index={index} /><span className="person-cell-copy"><strong>{item.firstName} {item.lastName}</strong><small>{item.employeeNumber}</small></span></span></td><td>{item.department}</td><td className="amount">{formatLkr(item.baseLkr)}</td><td className="amount">{formatLkr(item.allowanceLkr)}</td><td className="amount">{formatLkr(item.overtimeLkr)}</td><td className="amount highlight-cell">{formatLkr(item.baseLkr + item.allowanceLkr + item.overtimeLkr)}</td></tr>)}</tbody></table></div>}
      </Panel>}

      {view === "payslips" && <Panel title="Payslips" subtitle="Download a personal gross-pay preview as a CSV file." className="table-panel">
        {!data.items.length ? <div className="module-empty">Generate a payroll preview before downloading payslips.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Payroll period</th><th>Department</th><th>Net preview</th><th>File</th></tr></thead><tbody>{data.items.map((item, index) => <tr key={item.id}><td><span className="table-person"><Avatar name={`${item.firstName} ${item.lastName}`} index={index} /><span className="person-cell-copy"><strong>{item.firstName} {item.lastName}</strong><small>{item.employeeNumber}</small></span></span></td><td>{latest?.period}</td><td>{item.department}</td><td className="amount highlight-cell">{formatLkr(item.netLkr)}</td><td><a className="button-link" href={`/api/payroll/payslips/${item.employeeId}?period=${latest?.period}`}><Icon name="download" size={12} /> Download CSV</a></td></tr>)}</tbody></table></div>}
      </Panel>}

      {view === "deductions" && <Panel title="Deductions & benefits" subtitle="No statutory or tax deductions are currently inferred in this demo." className="table-panel">
        {!data.items.length ? <div className="module-empty">Generate a preview to review salary components.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Gross preview</th><th>Recorded deductions</th><th>Net preview</th><th>Note</th></tr></thead><tbody>{data.items.map((item, index) => <tr key={item.id}><td><span className="table-person"><Avatar name={`${item.firstName} ${item.lastName}`} index={index} /><span className="person-cell-copy"><strong>{item.firstName} {item.lastName}</strong><small>{item.employeeNumber}</small></span></span></td><td>{latest?.period}</td><td className="amount">{formatLkr(item.baseLkr + item.allowanceLkr + item.overtimeLkr)}</td><td className="amount">{formatLkr(item.deductionsLkr)}</td><td className="amount highlight-cell">{formatLkr(item.netLkr)}</td><td className="muted-cell">Review local rules before use</td></tr>)}</tbody></table></div>}
      </Panel>}

      <div className="policy-footer"><span><strong>{data.periods.length}</strong> payroll period{data.periods.length === 1 ? "" : "s"} in database</span><span>Payroll previews are logged in the Audit trail.</span></div>
    </div>
  </>;
}
