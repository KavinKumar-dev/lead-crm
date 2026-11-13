/**
 * Shared date-range utilities.
 *
 * All day boundaries are computed against the Asia/Kolkata (IST, UTC+05:30)
 * timezone so that "Today" always means the calendar day in India regardless
 * of the server's local timezone. Reusable by both the client and admin
 * dashboards.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export type DateRangeName =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thismonth"
  | "lastmonth"
  | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export const DATE_RANGE_OPTIONS: { value: DateRangeName; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

interface IstParts {
  year: number;
  month: number;
  day: number;
}

/** Wall-clock date components of `date` as seen in IST. */
function istParts(date: Date = new Date()): IstParts {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** 00:00:00.000 IST of the given calendar day, as an absolute instant. */
function istStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
}

/** 23:59:59.999 IST of the given calendar day, as an absolute instant. */
function istEndOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS);
}

/** Shift an IST calendar day by `delta` days (handles month/year rollover). */
function addDays(parts: IstParts, delta: number): IstParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month, parts.day + delta));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a "YYYY-MM-DD" string as midnight IST. Returns null for malformed or
 * impossible dates (e.g. 2026-02-31) instead of throwing.
 */
export function parseIstDate(value?: string | null): Date | null {
  if (!value || !ISO_DATE_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null; // rolled-over date: 31 Feb etc.
  }
  return istStartOfDay(y, m - 1, d);
}

/** Format a Date as "YYYY-MM-DD" using the IST calendar day it falls in. */
export function formatIstDate(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

export function isDateRangeName(value?: string | null): value is DateRangeName {
  return !!value && DATE_RANGE_OPTIONS.some((o) => o.value === value);
}

/**
 * Convert a filter name into an inclusive [start, end] range with IST day
 * boundaries. Unknown names fall back to "today". Invalid custom dates fall
 * back to today's boundaries (callers should pre-validate with
 * `parseIstDate` when they need to surface an error message).
 */
export function getDateRange(
  name?: string | null,
  custom?: { start?: string | null; end?: string | null }
): DateRange {
  const now = istParts();
  const todayStart = istStartOfDay(now.year, now.month, now.day);
  const todayEnd = istEndOfDay(now.year, now.month, now.day);

  switch ((name || "today").toLowerCase()) {
    case "yesterday": {
      const y = addDays(now, -1);
      return {
        start: istStartOfDay(y.year, y.month, y.day),
        end: istEndOfDay(y.year, y.month, y.day),
      };
    }

    case "last7days": {
      const from = addDays(now, -6); // today + previous 6 days
      return { start: istStartOfDay(from.year, from.month, from.day), end: todayEnd };
    }

    case "last30days": {
      const from = addDays(now, -29); // today + previous 29 days
      return { start: istStartOfDay(from.year, from.month, from.day), end: todayEnd };
    }

    case "thismonth": {
      return { start: istStartOfDay(now.year, now.month, 1), end: todayEnd };
    }

    case "lastmonth": {
      const firstOfPrev = new Date(Date.UTC(now.year, now.month - 1, 1));
      const lastOfPrev = new Date(Date.UTC(now.year, now.month, 0)); // day 0 = last day of previous month
      return {
        start: istStartOfDay(
          firstOfPrev.getUTCFullYear(),
          firstOfPrev.getUTCMonth(),
          firstOfPrev.getUTCDate()
        ),
        end: istEndOfDay(
          lastOfPrev.getUTCFullYear(),
          lastOfPrev.getUTCMonth(),
          lastOfPrev.getUTCDate()
        ),
      };
    }

    case "custom": {
      const start = parseIstDate(custom?.start) ?? todayStart;
      const end = parseIstDate(custom?.end) ?? todayEnd;
      return start <= end ? { start, end } : { start: end, end: start };
    }

    case "today":
    default:
      return { start: todayStart, end: todayEnd };
  }
}
