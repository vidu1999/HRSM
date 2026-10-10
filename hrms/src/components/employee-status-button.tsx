"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { Button } from "./ui";

export function EmployeeStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActive = status === "ACTIVE";

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/employees/${id}`, { method: "PATCH", body: { status: isActive ? "INACTIVE" : "ACTIVE" } });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={toggle} disabled={busy}>
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
