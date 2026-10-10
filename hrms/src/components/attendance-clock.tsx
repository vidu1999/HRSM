"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { Button } from "./ui";
import { formatTime } from "@/lib/format";

export function AttendanceClock({ checkIn, checkOut }: { checkIn: string | null; checkOut: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "CHECK_IN" | "CHECK_OUT") {
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/api/attendance", { body: { action } });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record attendance");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Check-in</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{formatTime(checkIn)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Check-out</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{formatTime(checkOut)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy || !!checkIn} onClick={() => act("CHECK_IN")}>Check in</Button>
        <Button variant="secondary" className="flex-1" disabled={busy || !checkIn || !!checkOut} onClick={() => act("CHECK_OUT")}>Check out</Button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
