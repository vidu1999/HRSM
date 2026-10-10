"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { useToast } from "./app-shell";
import { Icon } from "./icon";

export function EmployeeStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const toast = useToast(); const [busy, setBusy] = useState(false);
  const isActive = status === "ACTIVE";
  async function toggle() {
    if (isActive && !window.confirm("Deactivate this employee? Their record will be retained for audit purposes.")) return;
    setBusy(true);
    try {
      await apiRequest(`/api/employees/${id}`, { method: "PATCH", body: { status: isActive ? "INACTIVE" : "ACTIVE" } });
      toast({ title: isActive ? "Employee deactivated" : "Employee reactivated" }); router.refresh();
    } catch (reason) { toast({ title: reason instanceof Error ? reason.message : "Update failed", tone: "error" }); }
    finally { setBusy(false); }
  }
  return <button type="button" className="employee-status-action" onClick={() => void toggle()} disabled={busy} title={isActive ? "Deactivate employee" : "Reactivate employee"} aria-label={isActive ? "Deactivate employee" : "Reactivate employee"}>{busy ? "Saving…" : <><Icon name={isActive ? "close" : "check"} size={12} />{isActive ? "Deactivate" : "Activate"}</>}</button>;
}
