"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "./api-client";
import { useToast } from "./app-shell";

type Option = { id: string; label: string };

export function EmployeeForm({ departments, managers, onDone }: { departments: Option[]; managers: Option[]; onDone?: () => void }) {
  const router = useRouter(); const toast = useToast();
  const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    try {
      await apiRequest("/api/employees", {
        body: {
          firstName: value("firstName"), lastName: value("lastName"), email: value("email"), phone: value("phone") || null,
          birthDate: value("birthDate") || null, jobTitle: value("jobTitle"), departmentId: value("departmentId"), managerId: value("managerId") || null,
          employmentType: value("employmentType") || "FULL_TIME", joinDate: value("joinDate"), baseSalaryLkr: Number(value("baseSalaryLkr") || 0),
        },
      });
      formElement.reset();
      toast({ title: "Employee added", message: "A new employee profile has been created." });
      onDone?.(); router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not save employee";
      setError(message); toast({ title: message, tone: "error" });
    } finally { setSaving(false); }
  }

  return <form onSubmit={onSubmit} className="form-grid">
    <label>First name<input name="firstName" autoComplete="given-name" required maxLength={80} /></label>
    <label>Last name<input name="lastName" autoComplete="family-name" required maxLength={80} /></label>
    <label>Work email<input name="email" type="email" autoComplete="email" required maxLength={255} /></label>
    <label>Phone number<input name="phone" type="tel" placeholder="+94 77 000 0000" /></label>
    <label>Job title<input name="jobTitle" required maxLength={120} placeholder="e.g. Product Designer" /></label>
    <label>Department<select name="departmentId" required defaultValue=""><option value="" disabled>Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.label}</option>)}</select></label>
    <label>Manager<select name="managerId" defaultValue=""><option value="">No manager assigned</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.label}</option>)}</select></label>
    <label>Employment type<select name="employmentType" defaultValue="FULL_TIME"><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERN">Internship</option></select></label>
    <label>Join date<input name="joinDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
    <label>Date of birth<input name="birthDate" type="date" /></label>
    <label>Base salary (LKR / month)<input name="baseSalaryLkr" type="number" min={0} step={1000} defaultValue={0} /></label>
    {error && <p role="alert" className="form-error full-field">{error}</p>}
    <div className="modal-form-footer full-field"><button type="button" className="button-secondary" onClick={onDone}>Cancel</button><button type="submit" className="button-primary" disabled={saving}>{saving ? "Saving…" : "Create employee"}</button></div>
  </form>;
}
