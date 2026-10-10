"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "./api-client";
import { Button, inputClass, labelClass } from "./ui";

type Option = { id: string; label: string };

export function EmployeeForm({ departments, managers, onDone }: { departments: Option[]; managers: Option[]; onDone?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    try {
      await apiRequest("/api/employees", {
        body: {
          firstName: str("firstName"),
          lastName: str("lastName"),
          email: str("email"),
          phone: str("phone") || null,
          birthDate: str("birthDate") || null,
          jobTitle: str("jobTitle"),
          departmentId: str("departmentId"),
          managerId: str("managerId") || null,
          employmentType: str("employmentType") || "FULL_TIME",
          joinDate: str("joinDate"),
          baseSalaryLkr: Number(str("baseSalaryLkr") || 0),
        },
      });
      e.currentTarget.reset();
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save employee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="firstName">First name</label>
        <input id="firstName" name="firstName" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="lastName">Last name</label>
        <input id="lastName" name="lastName" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">Phone</label>
        <input id="phone" name="phone" className={inputClass} placeholder="+94 77 000 0000" />
      </div>
      <div>
        <label className={labelClass} htmlFor="jobTitle">Job title</label>
        <input id="jobTitle" name="jobTitle" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="departmentId">Department</label>
        <select id="departmentId" name="departmentId" required className={inputClass} defaultValue="">
          <option value="" disabled>Select…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="managerId">Manager</label>
        <select id="managerId" name="managerId" className={inputClass} defaultValue="">
          <option value="">No manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="employmentType">Employment type</label>
        <select id="employmentType" name="employmentType" className={inputClass} defaultValue="FULL_TIME">
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERN">Intern</option>
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="joinDate">Join date</label>
        <input id="joinDate" name="joinDate" type="date" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="birthDate">Date of birth</label>
        <input id="birthDate" name="birthDate" type="date" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="baseSalaryLkr">Base salary (LKR / month)</label>
        <input id="baseSalaryLkr" name="baseSalaryLkr" type="number" min={0} step={1000} className={inputClass} defaultValue={0} />
      </div>
      {error && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create employee"}</Button>
      </div>
    </form>
  );
}
