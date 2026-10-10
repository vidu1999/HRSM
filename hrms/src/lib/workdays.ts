/** Calendar-date helpers. All "business" dates are ISO strings (YYYY-MM-DD). */

export const APP_TIME_ZONE = "Asia/Colombo";

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar date in the company time zone (Asia/Colombo). */
export function todayInAppZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Number of working days between two ISO dates, inclusive.
 * Saturdays and Sundays are excluded. `holidays` (ISO dates) are excluded too.
 */
export function countWorkingDays(start: string, end: string, holidays: ReadonlySet<string> = new Set()): number {
  const from = parseIsoDate(start);
  const to = parseIsoDate(end);
  if (to < from) return 0;
  let count = 0;
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6 && !holidays.has(toIsoDate(d))) count++;
  }
  return count;
}

export function isoDateAddDays(value: string, days: number): string {
  const d = parseIsoDate(value);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}
