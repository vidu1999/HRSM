import Link from "next/link";
import { Icon } from "@/components/icon";
import { AddCandidateButton, AddJobButton, StageSelect } from "@/components/module-actions";
import { Avatar, Metric, PageHeading, Panel, StatusPill } from "@/components/presentation";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getRecruitmentSnapshot } from "@/lib/services/modules";
import { listDepartments } from "@/lib/services/employees";

export const dynamic = "force-dynamic";
const TABS = ["jobs", "applications", "interviews", "offers"] as const;
const LABELS = { jobs: "Job posts", applications: "Applications", interviews: "Interviews", offers: "Offers" } as const;

export default async function RecruitmentPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await requireSession();
  if (!can(session, "recruitment:read")) redirect("/");
  const { view: rawView } = await searchParams;
  const view = TABS.includes(rawView as typeof TABS[number]) ? rawView as typeof TABS[number] : "jobs";
  const [data, departments] = await Promise.all([getRecruitmentSnapshot(), listDepartments()]);
  const canWrite = ["SUPER_ADMIN", "HR_ADMIN"].includes(session.role);
  const applicants = data.applicants;
  const interviews = applicants.filter((applicant) => applicant.stage === "INTERVIEW");
  const offers = applicants.filter((applicant) => applicant.stage === "OFFER" || applicant.stage === "HIRED");

  return <>
    <PageHeading title="Recruitment" description="Applicant tracking system · jobs, candidates, interviews and offers" action={<>{canWrite && <AddCandidateButton jobs={data.jobs.filter((job) => job.status === "OPEN").map((job) => ({ id: job.id, title: job.title, department: job.department }))} />}{canWrite && <AddJobButton departments={departments.map((department) => ({ id: department.id, name: department.name }))} />}</>} />
    <div className="metrics-grid">
      <Metric label="Open positions" value={data.stats.openJobs} icon="recruitment" tone="blue" note="Published and accepting" />
      <Metric label="Active candidates" value={data.stats.candidates} icon="people" tone="green" note="In the pipeline" />
      <Metric label="Interviews" value={data.stats.interviews} icon="calendar" tone="orange" note="Scheduled or in progress" />
      <Metric label="Offers" value={data.stats.offers} icon="sparkles" tone="violet" note="Awaiting a response" />
    </div>
    <section className="panel table-panel">
      <header className="panel-header"><div><h2>Recruitment pipeline</h2><p>Move candidates through a clear, auditable hiring workflow.</p></div><span className="toolbar-caption">{data.jobs.length} job posts · {applicants.length} applications</span></header>
      <div className="module-tabs">{TABS.map((tab) => <Link key={tab} href={tab === "jobs" ? "/recruitment" : `/recruitment?view=${tab}`} className={`module-tab${view === tab ? " active" : ""}`}>{LABELS[tab]}<span className="tab-count">{tab === "jobs" ? data.jobs.length : tab === "applications" ? applicants.length : tab === "interviews" ? interviews.length : offers.length}</span></Link>)}</div>

      {view === "jobs" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Job title</th><th>Department</th><th>Applications</th><th>Employment</th><th>Posted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.jobs.length ? data.jobs.map((job, index) => <tr key={job.id}><td><span className="table-person"><span className={`department-icon dept-${index % 6}`}><Icon name="recruitment" size={14} /></span><span className="person-cell-copy"><strong>{job.title}</strong><small>{job.location}</small></span></span></td><td>{job.department}</td><td><strong className="highlight-cell">{job.applications}</strong> applicants</td><td>{job.employmentType.replaceAll("_", " ").toLowerCase()}</td><td>{formatDate(job.postedAt)}</td><td><StatusPill status={job.status} /></td><td>{job.status === "OPEN" && canWrite ? <AddCandidateButton jobs={[{ id: job.id, title: job.title, department: job.department }]} /> : <span className="muted-cell">—</span>}</td></tr>) : <tr><td className="empty-cell" colSpan={7}>No job posts yet. Add a role to start building your hiring pipeline.</td></tr>}</tbody></table></div>}

      {view === "applications" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Candidate</th><th>Role</th><th>Department</th><th>Applied</th><th>Source</th><th>Pipeline stage</th></tr></thead><tbody>{applicants.length ? applicants.map((candidate, index) => <tr key={candidate.id}><td><span className="table-person"><Avatar name={`${candidate.firstName} ${candidate.lastName}`} index={index} /><span className="person-cell-copy"><strong>{candidate.firstName} {candidate.lastName}</strong><small>{candidate.email}</small></span></span></td><td>{candidate.jobTitle}</td><td>{candidate.department}</td><td>{formatDate(candidate.appliedAt)}</td><td>{candidate.source}</td><td><StageSelect id={candidate.id} stage={candidate.stage} /></td></tr>) : <tr><td className="empty-cell" colSpan={6}>No applications have been received yet.</td></tr>}</tbody></table></div>}

      {view === "interviews" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Candidate</th><th>Position</th><th>Department</th><th>Interview</th><th>Stage</th></tr></thead><tbody>{interviews.length ? interviews.map((candidate, index) => <tr key={candidate.id}><td><span className="table-person"><Avatar name={`${candidate.firstName} ${candidate.lastName}`} index={index} /><span className="person-cell-copy"><strong>{candidate.firstName} {candidate.lastName}</strong><small>{candidate.email}</small></span></span></td><td>{candidate.jobTitle}</td><td>{candidate.department}</td><td>{candidate.interviewAt ? formatDate(candidate.interviewAt) : "To be scheduled"}</td><td><StageSelect id={candidate.id} stage={candidate.stage} /></td></tr>) : <tr><td className="empty-cell" colSpan={5}>No interviews are currently scheduled.</td></tr>}</tbody></table></div>}

      {view === "offers" && <div className="table-wrap"><table className="data-table"><thead><tr><th>Candidate</th><th>Position</th><th>Department</th><th>Source</th><th>Offer status</th><th>Update</th></tr></thead><tbody>{offers.length ? offers.map((candidate, index) => <tr key={candidate.id}><td><span className="table-person"><Avatar name={`${candidate.firstName} ${candidate.lastName}`} index={index} /><span className="person-cell-copy"><strong>{candidate.firstName} {candidate.lastName}</strong><small>{candidate.email}</small></span></span></td><td>{candidate.jobTitle}</td><td>{candidate.department}</td><td>{candidate.source}</td><td><StatusPill status={candidate.stage} /></td><td><StageSelect id={candidate.id} stage={candidate.stage} /></td></tr>) : <tr><td className="empty-cell" colSpan={6}>No offers are waiting for a response.</td></tr>}</tbody></table></div>}
    </section>
    <footer className="policy-footer"><span><Icon name="shield" size={12} /> Each stage change is written to the audit log.</span><span>Applications and candidate data are stored in PostgreSQL.</span></footer>
  </>;
}
