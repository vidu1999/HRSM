"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { Button } from "./ui";

/** Approve / reject (for approvers) and cancel (for the owner or HR). Server enforces all rules. */
export function LeaveActions({ id, canDecide, canCancel }: { id: string; canDecide: boolean; canCancel: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "approve" | "reject" | "cancel") {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "cancel") {
        await apiRequest(`/api/leave/${id}/cancel`, { method: "POST" });
      } else {
        const note = kind === "reject" ? window.prompt("Reason for rejection (optional):") ?? undefined : undefined;
        if (kind === "reject" && note === undefined && !window.confirm("Reject this request?")) return;
        await apiRequest(`/api/leave/${id}/decision`, {
          body: { decision: kind === "approve" ? "APPROVE" : "REJECT", note: note || undefined },
        });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!canDecide && !canCancel) return null;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {canDecide && (
          <>
            <Button variant="primary" className="px-2.5 py-1 text-xs" disabled={!!busy} onClick={() => run("approve")}>
              {busy === "approve" ? "…" : "Approve"}
            </Button>
            <Button variant="secondary" className="px-2.5 py-1 text-xs" disabled={!!busy} onClick={() => run("reject")}>
              {busy === "reject" ? "…" : "Reject"}
            </Button>
          </>
        )}
        {canCancel && (
          <Button variant="ghost" className="px-2 py-1 text-xs" disabled={!!busy} onClick={() => run("cancel")}>
            {busy === "cancel" ? "…" : "Cancel"}
          </Button>
        )}
      </div>
      {error && <span className="max-w-[16rem] text-right text-xs text-rose-600">{error}</span>}
    </div>
  );
}
