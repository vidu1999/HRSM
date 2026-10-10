"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "./icon";
import { EmployeeForm } from "./employee-form";
import { LeaveForm } from "./leave-form";
import { useToast } from "./app-shell";

async function sendJson(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request could not be completed");
  return result;
}

export function Modal({ open, title, subtitle, onClose, children, wide = false }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal-card${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="modal-close" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={15} /></button></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function DepartmentForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await sendJson("/api/departments", "POST", { name: form.get("name"), code: form.get("code") });
      toast({ title: "Department created", message: "Your organization structure has been updated." });
      onDone(); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the department");
    } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><label>Department name<input name="name" required maxLength={120} placeholder="e.g. Customer Success" /></label><label>Department code<input name="code" required minLength={2} maxLength={10} pattern="[A-Za-z0-9]+" placeholder="e.g. CS" /></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Create department"}</button></div></form>;
}

export function JobForm({ departments, onDone }: { departments: { id: string; name: string }[]; onDone: () => void }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      await sendJson("/api/recruitment", "POST", { kind: "job", title: form.get("title"), departmentId: form.get("departmentId"), employmentType: form.get("employmentType"), location: form.get("location"), description: form.get("description") });
      toast({ title: "Job posted", message: "The role is now open in your recruitment pipeline." }); onDone(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the job post"); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><label>Job title<input name="title" required maxLength={140} placeholder="e.g. Senior Product Designer" /></label><label>Department<select name="departmentId" required defaultValue=""><option value="" disabled>Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label>Employment type<select name="employmentType" defaultValue="FULL_TIME"><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERN">Internship</option></select></label><label>Location<input name="location" required defaultValue="Colombo / Hybrid" /></label><label className="full-field">Role summary<textarea name="description" rows={3} maxLength={2000} placeholder="What will this person work on?" /></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Publish role"}</button></div></form>;
}

export function CandidateForm({ jobs, onDone }: { jobs: { id: string; title: string; department: string }[]; onDone: () => void }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      await sendJson("/api/recruitment", "POST", { kind: "application", jobPostId: form.get("jobPostId"), firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"), source: form.get("source") });
      toast({ title: "Candidate added", message: "The application is now in the recruitment pipeline." }); onDone(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add the candidate"); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><label>First name<input name="firstName" required maxLength={80} /></label><label>Last name<input name="lastName" required maxLength={80} /></label><label>Email<input name="email" type="email" required /></label><label>Phone<input name="phone" type="tel" /></label><label>Applying for<select name="jobPostId" required defaultValue=""><option value="" disabled>Choose an open role</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title} · {job.department}</option>)}</select></label><label>Source<select name="source" defaultValue="Referral"><option>Referral</option><option>LinkedIn</option><option>Careers page</option><option>Job board</option><option>Direct</option></select></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Add candidate"}</button></div></form>;
}

export function GoalForm({ employees, onDone }: { employees: { id: string; label: string }[]; onDone: () => void }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      await sendJson("/api/performance", "POST", { employeeId: form.get("employeeId"), title: form.get("title"), category: form.get("category"), description: form.get("description"), dueDate: form.get("dueDate") || undefined });
      toast({ title: "Goal created", message: "The goal has been added to the performance plan." }); onDone(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the goal"); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><label>Employee<select name="employeeId" required defaultValue=""><option value="" disabled>Select an employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select></label><label>Category<select name="category" defaultValue="Individual goal"><option>Individual goal</option><option>Business impact</option><option>Product delivery</option><option>Quality</option><option>Learning & growth</option></select></label><label className="full-field">Goal title<input name="title" required maxLength={180} placeholder="e.g. Improve customer response time" /></label><label className="full-field">Description<textarea name="description" rows={3} maxLength={1000} /></label><label>Due date<input name="dueDate" type="date" /></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Create goal"}</button></div></form>;
}

export function DocumentUploadForm({ employees, onDone }: { employees: { id: string; label: string }[]; onDone: () => void }) {
  const router = useRouter(); const toast = useToast(); const inputRef = useRef<HTMLInputElement>(null); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/documents", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Upload failed");
      toast({ title: "Document uploaded", message: "The file and its metadata are stored securely in the HRMS database." }); onDone(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not upload the document"); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><label className="full-field">Display name<input name="title" required maxLength={200} placeholder="e.g. Updated employment contract" /></label><label>Category<select name="category" defaultValue="Employee Documents"><option>Employee Documents</option><option>Contracts</option><option>Company Policy</option><option>Payroll</option><option>Onboarding</option><option>Medical</option><option>Other</option></select></label><label>Employee<select name="employeeId" defaultValue=""><option value="">Company-wide document</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select></label><label className="full-field upload-dropzone"><Icon name="upload" size={18} /><span>Choose a document file</span><small>Up to 2.5 MB · the content is stored in PostgreSQL</small><input ref={inputRef} type="file" name="file" required /></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Uploading…" : "Upload document"}</button></div></form>;
}

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false);
  async function change(next: string) {
    setSaving(true);
    try { await sendJson(`/api/recruitment/${id}`, "PATCH", { stage: next }); toast({ title: "Candidate stage updated" }); router.refresh(); }
    catch (error) { toast({ title: error instanceof Error ? error.message : "Could not update candidate", tone: "error" }); }
    finally { setSaving(false); }
  }
  return <select className="stage-select" aria-label="Candidate stage" value={stage} disabled={saving} onChange={(event) => void change(event.target.value)}><option value="APPLIED">Applied</option><option value="SCREENING">Screening</option><option value="INTERVIEW">Interview</option><option value="OFFER">Offer</option><option value="HIRED">Hired</option><option value="DECLINED">Declined</option></select>;
}

export function GoalProgressButton({ id, progress }: { id: string; progress: number }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false);
  async function advance() {
    if (progress >= 100) return;
    setSaving(true);
    try { await sendJson(`/api/performance/${id}`, "PATCH", { progress: Math.min(100, progress + 10) }); toast({ title: "Goal progress updated", message: `${Math.min(100, progress + 10)}% complete.` }); router.refresh(); }
    catch (error) { toast({ title: error instanceof Error ? error.message : "Could not update goal", tone: "error" }); }
    finally { setSaving(false); }
  }
  return <button className="button-link" type="button" disabled={saving || progress >= 100} onClick={() => void advance()}>{progress >= 100 ? "Completed" : saving ? "Saving…" : "Update +10%"}</button>;
}

export function DeleteDocumentButton({ id, title }: { id: string; title: string }) {
  const router = useRouter(); const toast = useToast(); const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`Delete “${title}” from the document library?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not delete document");
      toast({ title: "Document deleted", message: "The file and its database record have been removed." }); router.refresh();
    } catch (error) { toast({ title: error instanceof Error ? error.message : "Could not delete document", tone: "error" }); }
    finally { setBusy(false); }
  }
  return <button className="row-action" type="button" title="Delete document" aria-label={`Delete ${title}`} onClick={() => void remove()} disabled={busy}><Icon name="close" size={13} /></button>;
}

export function PayrollRunForm({ onDone }: { onDone: () => void }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const now = new Date(); const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/payroll", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ period: form.get("period") }) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Payroll could not be generated");
      toast({ title: "Payroll preview generated", message: `${body.employeeCount ?? "Your team"} employees included. No payments were sent.` }); onDone(); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not generate the payroll preview"); } finally { setSaving(false); }
  }
  return <form className="form-grid" onSubmit={submit}><div className="confirm-box full-field"><strong>Safe payroll preview</strong><p>This creates a database-backed gross-pay preview from active base salaries. It does not calculate statutory deductions, file taxes, or transfer money.</p></div><label>Payroll period<input name="period" type="month" defaultValue={defaultPeriod} required /></label>{error && <p className="form-error full-field">{error}</p>}<div className="modal-form-footer full-field"><button className="button-secondary" type="button" onClick={onDone}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "Generating…" : "Generate preview"}</button></div></form>;
}

export function SettingsForm({ initial, section }: { initial: Record<string, Record<string, unknown>>; section: "general" | "security" | "system" }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const company = initial.company ?? {}; const security = initial.security ?? {}; const settings = initial.notifications ?? {};
  const [mfa, setMfa] = useState(Boolean(security.mfaRequired));
  const [strongPassword, setStrongPassword] = useState(Boolean(security.strongPassword));
  const [emailUpdates, setEmailUpdates] = useState(settings.emailUpdates !== false);
  const [leaveAlerts, setLeaveAlerts] = useState(settings.leaveAlerts !== false);
  const [payrollAlerts, setPayrollAlerts] = useState(settings.payrollAlerts !== false);
  const [birthdays, setBirthdays] = useState(settings.birthdayReminders !== false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget);
    const body = section === "general" ? {
      company: { name: form.get("companyName"), legalName: form.get("legalName"), email: form.get("companyEmail"), phone: form.get("companyPhone"), currency: form.get("currency"), timeZone: form.get("timeZone") },
    } : section === "security" ? {
      security: { mfaRequired: mfa, strongPassword, sessionTimeoutMinutes: Number(form.get("sessionTimeout")), passwordExpiryDays: Number(form.get("passwordExpiry")) },
    } : {
      notifications: { emailUpdates, leaveAlerts, payrollAlerts, birthdayReminders: birthdays },
    };
    try {
      const response = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "Settings could not be saved");
      toast({ title: "Settings saved", message: "Your workspace preferences are up to date." }); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save settings"); } finally { setSaving(false); }
  }
  return <form onSubmit={submit}>
    {section === "general" && <section className="settings-section"><h2>Company profile</h2><p>Workspace identity and regional defaults.</p><div className="settings-form-grid"><label>Company name<input name="companyName" defaultValue={String(company.name ?? "")} required /></label><label>Legal entity<input name="legalName" defaultValue={String(company.legalName ?? "")} /></label><label>HR contact email<input name="companyEmail" type="email" defaultValue={String(company.email ?? "")} /></label><label>Phone<input name="companyPhone" defaultValue={String(company.phone ?? "")} /></label><label>Currency<select name="currency" defaultValue={String(company.currency ?? "LKR")}><option value="LKR">LKR — Sri Lankan Rupee</option><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option></select></label><label>Time zone<select name="timeZone" defaultValue={String(company.timeZone ?? "Asia/Colombo")}><option value="Asia/Colombo">Asia/Colombo</option><option value="Asia/Dubai">Asia/Dubai</option><option value="UTC">UTC</option></select></label></div></section>}
    {section === "security" && <section className="settings-section"><h2>Security & access</h2><p>Security controls are saved as workspace policy. Authentication and authorization are enforced server-side.</p><SettingRow title="Multi-factor authentication" detail="Require a second factor for administrator accounts." enabled={mfa} onChange={setMfa} /><SettingRow title="Strong password policy" detail="Require a long password and a mix of character types." enabled={strongPassword} onChange={setStrongPassword} /><div className="settings-form-grid compact"><label>Session timeout (minutes)<input name="sessionTimeout" type="number" min={5} max={1440} defaultValue={Number(security.sessionTimeoutMinutes ?? 60)} /></label><label>Password expiry (days)<input name="passwordExpiry" type="number" min={30} max={365} defaultValue={Number(security.passwordExpiryDays ?? 90)} /></label></div></section>}
    {section === "system" && <><section className="settings-section"><h2>Notification preferences</h2><p>Choose which updates are sent to your HR team.</p><SettingRow title="Email updates" detail="Send important workflow activity to the HR inbox." enabled={emailUpdates} onChange={setEmailUpdates} /><SettingRow title="Leave approvals" detail="Notify HR when leave requests need attention." enabled={leaveAlerts} onChange={setLeaveAlerts} /><SettingRow title="Payroll reminders" detail="Show reminders when a payroll preview is due." enabled={payrollAlerts} onChange={setPayrollAlerts} /><SettingRow title="Birthday reminders" detail="Show upcoming employee birthdays on the dashboard." enabled={birthdays} onChange={setBirthdays} /></section><section className="settings-section"><h2>System status</h2><p>Service and database health for this workspace.</p><div className="setting-line"><span>Application</span><strong><span className="footnote-dot" /> Operational</strong></div><div className="setting-line"><span>Database</span><strong>PostgreSQL · connected</strong></div><div className="setting-line"><span>Workspace version</span><strong>v2.4.0</strong></div></section></>}
    {error && <p role="alert" className="form-error settings-error">{error}</p>}
    <div className="settings-save"><span>Changes are stored in PostgreSQL.</span><button className="button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
  </form>;
}

export function UserRoleSelect({ id, role, disabled = false }: { id: string; role: string; disabled?: boolean }) {
  const router = useRouter(); const toast = useToast(); const [saving, setSaving] = useState(false);
  async function change(next: string) {
    const oldRole = role;
    if (oldRole === next) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: next }) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Role could not be updated");
      toast({ title: "Access role updated", message: "The change has been recorded in the audit log." }); router.refresh();
    } catch (reason) { toast({ title: reason instanceof Error ? reason.message : "Role update failed", tone: "error" }); }
    finally { setSaving(false); }
  }
  return <select className="role-select" value={role} disabled={disabled || saving} onChange={(event) => void change(event.target.value)} aria-label="User role"><option value="SUPER_ADMIN">Super Admin</option><option value="HR_ADMIN">HR Admin</option><option value="MANAGER">Manager</option><option value="EMPLOYEE">Employee</option></select>;
}

export function AddEmployeeButton({ departments, managers }: { departments: { id: string; label: string }[]; managers: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Add employee</button><Modal open={open} title="Add an employee" subtitle="Create a new employee profile and set their reporting line." onClose={() => setOpen(false)} wide><EmployeeForm departments={departments} managers={managers} onDone={() => setOpen(false)} /></Modal></>;
}

export function LeaveRequestButton({ leaveTypes, employees, defaultEmployeeId }: { leaveTypes: { id: string; label: string }[]; employees?: { id: string; label: string }[]; defaultEmployeeId?: string }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Apply for leave</button><Modal open={open} title="Request leave" subtitle="Your request will be routed to the correct approver." onClose={() => setOpen(false)}><LeaveForm leaveTypes={leaveTypes} employees={employees} defaultEmployeeId={defaultEmployeeId} /></Modal></>;
}

export function AddDepartmentButton() {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Add department</button><Modal open={open} title="Create department" subtitle="Add a department to your organization." onClose={() => setOpen(false)}><DepartmentForm onDone={() => setOpen(false)} /></Modal></>;
}

export function AddJobButton({ departments }: { departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Add job</button><Modal open={open} title="Create a job post" subtitle="Open a new role in your recruitment pipeline." onClose={() => setOpen(false)}><JobForm departments={departments} onDone={() => setOpen(false)} /></Modal></>;
}

export function AddCandidateButton({ jobs }: { jobs: { id: string; title: string; department: string }[] }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-secondary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Add candidate</button><Modal open={open} title="Add a candidate" subtitle="Create an application for an open position." onClose={() => setOpen(false)}><CandidateForm jobs={jobs} onDone={() => setOpen(false)} /></Modal></>;
}

export function AddGoalButton({ employees }: { employees: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="plus" size={13} /> Add goal</button><Modal open={open} title="Create a performance goal" subtitle="Assign a measurable objective to an employee." onClose={() => setOpen(false)}><GoalForm employees={employees} onDone={() => setOpen(false)} /></Modal></>;
}

export function UploadDocumentButton({ employees }: { employees: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="upload" size={13} /> Upload document</button><Modal open={open} title="Upload a document" subtitle="The file itself and its metadata are encrypted in the application database." onClose={() => setOpen(false)}><DocumentUploadForm employees={employees} onDone={() => setOpen(false)} /></Modal></>;
}

export function RunPayrollButton() {
  const [open, setOpen] = useState(false);
  return <><button className="button-primary" type="button" onClick={() => setOpen(true)}><Icon name="sparkles" size={13} /> Generate payroll</button><Modal open={open} title="Generate payroll preview" subtitle="Create an auditable gross-pay snapshot for a selected month." onClose={() => setOpen(false)}><PayrollRunForm onDone={() => setOpen(false)} /></Modal></>;
}

function SettingRow({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="setting-row"><span><strong>{title}</strong><small>{detail}</small></span><button className={`switch${enabled ? " on" : ""}`} type="button" role="switch" aria-checked={enabled} aria-label={title} onClick={() => onChange(!enabled)} /></div>;
}
