"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { apiRequest } from "./api-client";
import { Button, inputClass, labelClass } from "./ui";

type Option = { id: string; label: string };

export function LeaveForm({
  leaveTypes,
  employees,
  defaultEmployeeId,
}: {
  leaveTypes: Option[];
  employees?: Option[]; // provided for HR/managers who can request on behalf of others
  defaultEmployeeId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });

  // Quick client-side hint; the server is the source of truth for working days.
  const hint = useMemo(() => {
    if (!range.start || !range.end || range.end < range.start) return null;
    let n = 0;
    for (let d = new Date(`${range.start}T00:00:00Z`); d <= new Date(`${range.end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.getUTCDay();
      if (day !== 0 && day !== 6) n++;
    }
    return n;
  }, [range]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const f = new FormData(e.currentTarget);
    try {
      await apiRequest("/api/leave", {
        body: {
          employeeId: String(f.get("employeeId") || defaultEmployeeId || "") || undefined,
          leaveTypeId: String(f.get("leaveTypeId")),
          startDate: String(f.get("startDate")),
          endDate: String(f.get("endDate")),
          reason: String(f.get("reason") || "") || undefined,
        },
      });
      setSuccess("Leave request submitted for approval.");
      e.currentTarget.reset();
      setRange({ start: "", end: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {employees && (
        <div>
          <label className={labelClass} htmlFor="employeeId">Employee</label>
          <select id="employeeId" name="employeeId" className={inputClass} defaultValue={defaultEmployeeId ?? ""}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="leaveTypeId">Leave type</label>
        <select id="leaveTypeId" name="leaveTypeId" required className={inputClass} defaultValue="">
          <option value="" disabled>Select…</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="startDate">From</label>
          <input id="startDate" name="startDate" type="date" required className={inputClass} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass} htmlFor="endDate">To</label>
          <input id="endDate" name="endDate" type="date" required className={inputClass} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
        </div>
      </div>
      {hint !== null && <p className="text-xs text-slate-500">{hint} working day{hint === 1 ? "" : "s"} (weekends excluded)</p>}
      <div>
        <label className={labelClass} htmlFor="reason">Reason (optional)</label>
        <textarea id="reason" name="reason" rows={2} maxLength={1000} className={inputClass} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      <Button type="submit" disabled={saving} className="w-full">{saving ? "Submitting…" : "Submit request"}</Button>
    </form>
  );
}
