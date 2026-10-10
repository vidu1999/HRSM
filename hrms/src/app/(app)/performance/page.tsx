import Link from "next/link";
import { Icon } from "@/components/icon";
import { AddGoalButton, GoalProgressButton } from "@/components/module-actions";
import { Avatar, Metric, PageHeading, Panel, StatusPill } from "@/components/presentation";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { getPerformanceSnapshot } from "@/lib/services/modules";
import { listEmployeeOptions } from "@/lib/services/employees";

export const dynamic = "force-dynamic";
const TABS = ["goals", "reviews", "kpis", "feedback"] as const;
const LABELS = { goals: "Goals", reviews: "Reviews", kpis: "KPIs", feedback: "Feedback" } as const;

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  const { view: rawView } = await searchParams;
  const view = TABS.includes(rawView as typeof TABS[number]) ? rawView as typeof TABS[number] : "goals";
  const [data, employeeOptions] = await Promise.all([getPerformanceSnapshot(session), can(session, "performance:write") ? listEmployeeOptions(session) : Promise.resolve([])]);
  const onTrack = data.goals.filter((goal) => goal.status === "ON_TRACK").length;
  const completed = data.goals.filter((goal) => goal.status === "COMPLETED").length;
  const categories = Array.from(new Set(data.goals.map((goal) => goal.category))).map((category) => {
    const goals = data.goals.filter((goal) => goal.category === category);
    return { category, count: goals.length, progress: Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) };
  });

  return <>
    <PageHeading title="Performance management" description="Goals, progress and review cycles · employee data is scoped to your access." action={can(session, "performance:write") ? <AddGoalButton employees={employeeOptions} /> : undefined} />
    <div className="metrics-grid">
      <Metric label="Active goals" value={data.stats.goals} icon="target" tone="blue" note="Across your current scope" />
      <Metric label="Average progress" value={`${data.stats.averageProgress}%`} icon="chart" tone="green" note="Progress recorded in database" />
      <Metric label="On track" value={onTrack} icon="check" tone="violet" note="Goals progressing as planned" />
      <Metric label="Review cycles" value={data.stats.reviews} icon="performance" tone="orange" note={`${completed} goals completed`} />
    </div>
    <section className="panel table-panel">
      <header className="panel-header"><div><h2>Performance workspace</h2><p>Quarterly objectives and employee review data</p></div><span className="panel-meta"><span className="status-badge info">Q4 2026 cycle</span></span></header>
      <div className="module-tabs">{TABS.map((tab) => <Link key={tab} href={tab === "goals" ? "/performance" : `/performance?view=${tab}`} className={`module-tab${view === tab ? " active" : ""}`}>{LABELS[tab]}<span className="tab-count">{tab === "goals" || tab === "kpis" ? data.goals.length : data.reviews.length}</span></Link>)}</div>
      {view === "goals" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Goal</th><th>Category</th><th>Progress</th><th>Due date</th><th>Status</th><th>Update</th></tr></thead><tbody>{data.goals.length ? data.goals.map((goal, index) => <tr key={goal.id}><td><span className="table-person"><Avatar name={goal.employeeName} index={index} /><span className="person-cell-copy"><strong>{goal.employeeName}</strong><small>{goal.employeeNumber} · {goal.department}</small></span></span></td><td className="highlight-cell">{goal.title}<small className="sub-cell">{goal.description}</small></td><td>{goal.category}</td><td><span className="progress-cell"><span className="progress-track"><i style={{ width: `${goal.progress}%`, background: goal.status === "AT_RISK" ? "#e66c71" : undefined }} /></span><b>{goal.progress}%</b></span></td><td>{goal.dueDate ? formatDate(goal.dueDate) : "—"}</td><td><StatusPill status={goal.status} /></td><td>{can(session, "performance:write") ? <GoalProgressButton id={goal.id} progress={goal.progress} /> : <span className="muted-cell">View only</span>}</td></tr>) : <tr><td className="empty-cell" colSpan={7}>No goals have been assigned in your current scope.</td></tr>}</tbody></table></div>}
      {view === "reviews" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Employee</th><th>Review period</th><th>Rating</th><th>Status</th><th>Summary</th><th>Last updated</th></tr></thead><tbody>{data.reviews.length ? data.reviews.map((review, index) => <tr key={review.id}><td><span className="table-person"><Avatar name={review.employeeName} index={index} /><span className="person-cell-copy"><strong>{review.employeeName}</strong><small>{review.employeeNumber} · {review.department}</small></span></span></td><td>{review.period}</td><td><span className="rating-stars">{review.rating ? "★".repeat(review.rating) : "—"}</span>{review.rating ? <small className="sub-cell">{review.rating} / 5</small> : null}</td><td><StatusPill status={review.status} /></td><td className="description-cell" title={review.summary ?? "—"}>{review.summary ?? "—"}</td><td>{formatDate(review.updatedAt)}</td></tr>) : <tr><td className="empty-cell" colSpan={6}>No performance reviews have been recorded yet.</td></tr>}</tbody></table></div>}
      {view === "kpis" && <div className="kpi-category-grid">{categories.length ? categories.map((category, index) => <article className="kpi-category-card" key={category.category}><div className={`department-icon dept-${index % 6}`}><Icon name="target" /></div><span><small>{category.category}</small><strong>{category.progress}%</strong><em>{category.count} goal{category.count === 1 ? "" : "s"}</em></span><div className="balance-track"><span style={{ width: `${category.progress}%` }} /></div></article>) : <div className="module-empty">No KPI data is available yet.</div>}</div>}
      {view === "feedback" && <div className="feedback-grid">{data.reviews.filter((review) => review.summary).length ? data.reviews.filter((review) => review.summary).map((review, index) => <article className="feedback-card" key={review.id}><div className="feedback-card-top"><Avatar name={review.employeeName} index={index} /><span><strong>{review.employeeName}</strong><small>{review.period} · {review.department}</small></span><span className="rating-stars">{review.rating ? "★".repeat(review.rating) : "—"}</span></div><p>“{review.summary}”</p><StatusPill status={review.status} /></article>) : <div className="module-empty">Feedback from completed review cycles will appear here.</div>}</div>}
    </section>
  </>;
}
