"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { useToast } from "./app-shell";

/** Approve/reject (approvers) and cancel (owner or HR); server-side RBAC is authoritative. */
export function LeaveActions({ id, canDecide, canCancel, compact = false }: { id: string; canDecide: boolean; canCancel: boolean; compact?: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "approve" | "reject" | "cancel") {
    if (kind === "cancel" && !window.confirm("Cancel this leave request?")) return;
    setBusy(kind); setError(null);
    try {
      if (kind === "cancel") {
        await apiRequest(`/api/leave/${id}/cancel`, { method: "POST" });
      } else {
        const note = kind === "reject" ? window.prompt("Reason for rejection (optional):") ?? undefined : undefined;
        if (kind === "reject" && note === undefined && !window.confirm("Reject this request without a note?")) return;
        await apiRequest(`/api/leave/${id}/decision`, { body: { decision: kind === "approve" ? "APPROVE" : "REJECT", note: note || undefined } });
      }
      const label = kind === "approve" ? "Leave request approved" : kind === "reject" ? "Leave request rejected" : "Leave request cancelled";
      toast({ title: label, message: "The request and audit log have been updated." });
      router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Action failed";
      setError(message); toast({ title: message, tone: "error" });
    } finally { setBusy(null); }
  }

  if (!canDecide && !canCancel) return null;
  return <div className={`leave-actions${compact ? " compact" : ""}`}>
    {canDecide && <><button type="button" className="button-primary" disabled={!!busy} onClick={() => void run("approve")}>{busy === "approve" ? "…" : "Approve"}</button><button type="button" className="button-secondary" disabled={!!busy} onClick={() => void run("reject")}>{busy === "reject" ? "…" : "Reject"}</button></>}
    {canCancel && <button type="button" className="row-action" aria-label="Cancel request" title="Cancel request" disabled={!!busy} onClick={() => void run("cancel")}>×</button>}
    {error && <span className="form-error">{error}</span>}
  </div>;
}
