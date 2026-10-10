"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "./api-client";
import { useToast } from "./app-shell";

type Option = { id: string; label: string };

export function LeaveForm({ leaveTypes, employees, defaultEmployeeId }: { leaveTypes: Option[]; employees?: Option[]; defaultEmployeeId?: string }) {
  const router = useRouter(); const toast = useToast();
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [range, setRange] = useState({ start: "", end: "" });
  const hint = useMemo(() => {
    if (!range.start || !range.end || range.end < range.start) return null;
    let days = 0;
    for (let date = new Date(`${range.start}T00:00:00Z`); date <= new Date(`${range.end}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) {
      const day = date.getUTCDay(); if (day !== 0 && day !== 6) days++;
    }
    return days;
  }, [range]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    const formElement = event.currentTarget; const form = new FormData(formElement);
    try {
      await apiRequest("/api/leave", { body: {
        employeeId: String(form.get("employeeId") || defaultEmployeeId || "") || undefined,
        leaveTypeId: String(form.get("leaveTypeId")), startDate: String(form.get("startDate")), endDate: String(form.get("endDate")), reason: String(form.get("reason") || "") || undefined,
      } });
      formElement.reset(); setRange({ start: "", end: "" });
      toast({ title: "Leave request submitted", message: "It has been added to the approval workflow." }); router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not submit request"; setError(message); toast({ title: message, tone: "error" });
    } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="form-grid leave-form">
    {employees && <label className="full-field">Employee<select name="employeeId" defaultValue={defaultEmployeeId ?? ""}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}</select></label>}
    <label className="full-field">Leave type<select name="leaveTypeId" required defaultValue=""><option value="" disabled>Select a leave type</option>{leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
    <label>From<input name="startDate" type="date" required onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))} /></label>
    <label>To<input name="endDate" type="date" required onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))} /></label>
    <label className="full-field">Reason <span className="optional-label">Optional</span><textarea name="reason" rows={2} maxLength={1000} placeholder="Add a short note for your approver" /></label>
    {hint !== null && <p className="form-hint full-field">{hint} working day{hint === 1 ? "" : "s"} · weekends excluded</p>}
    {error && <p role="alert" className="form-error full-field">{error}</p>}
    <button type="submit" className="button-primary full-field" disabled={saving}>{saving ? "Submitting…" : "Submit request"}</button>
  </form>;
}
