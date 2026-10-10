"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "./api-client";
import { useToast } from "./app-shell";
import { formatTime } from "@/lib/format";

export function AttendanceClock({ checkIn, checkOut, compact = false }: { checkIn: string | null; checkOut: string | null; compact?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "CHECK_IN" | "CHECK_OUT") {
    setBusy(true); setError(null);
    try {
      await apiRequest("/api/attendance", { body: { action } });
      toast({ title: action === "CHECK_IN" ? "You’re checked in" : "You’re checked out", message: "Your attendance record was saved." });
      router.refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not record attendance";
      setError(message); toast({ title: message, tone: "error" });
    } finally { setBusy(false); }
  }

  return <div className={`attendance-clock-card${compact ? " compact" : ""}`}>
    <div className="attendance-clock-grid">
      <div className="clock-time"><small><span className="clock-dot green" />Check-in</small><strong>{formatTime(checkIn)}</strong></div>
      <div className="clock-time"><small><span className="clock-dot blue" />Check-out</small><strong>{formatTime(checkOut)}</strong></div>
    </div>
    <div className="clock-actions">
      <button className="button-primary" type="button" disabled={busy || !!checkIn} onClick={() => void act("CHECK_IN")}>{busy && !checkIn ? "Saving…" : checkIn ? "Checked in" : "Check in"}</button>
      <button className="button-secondary" type="button" disabled={busy || !checkIn || !!checkOut} onClick={() => void act("CHECK_OUT")}>{checkOut ? "Checked out" : "Check out"}</button>
    </div>
    {!compact && <p className="clock-message">One check-in and check-out per local day. Times use Asia/Colombo.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
