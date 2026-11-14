/**
 * Shared date-range utilities.
 *
 * All day boundaries are computed against the Asia/Kolkata (IST, UTC+05:30)
 * timezone so that "Today" always means the calendar day in India regardless
 * of the server's local timezone. Reusable by both the client and admin
 * dashboards.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** IST offset in seconds — used for SQL date bucketing (epoch seconds). */
export const IST_OFFSET_SECONDS = IST_OFFSET_MS / 1000;

/** IST offset in minutes — used for SQL date bucketing (PostgreSQL). */
export const IST_OFFSET_MINUTES = IST_OFFSET_MS / 60000;

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
export function istEndOfDay(date: Date): Date {
  // If date is already midnight IST, adding 24h - 1ms gives 23:59:59.999 IST.
  return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** 23:59:59.999 IST of the given calendar day parts. */
function istEndOfDayFromParts(year: number, month: number, day: number): Date {
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

/**
 * Every IST calendar day covered by a range, as "YYYY-MM-DD" strings.
 *
 * Used by the daily reports so that days without any activity still appear
 * (with zero counts) instead of being missing from the output.
 */
export function eachIstDayInRange(range: DateRange): string[] {
  // Convert both bounds to IST calendar days.
  const startDay = formatIstDate(range.start);
  const endDay = formatIstDate(range.end);

  const start = parseIstDate(startDay);
  const end = parseIstDate(endDay);
  if (!start || !end) return [];

  const days: string[] = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    days.push(formatIstDate(cursor));
    // Advance one calendar day (24h) in IST terms.
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
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
  const todayEnd = istEndOfDayFromParts(now.year, now.month, now.day);

  switch ((name || "today").toLowerCase()) {
    case "yesterday": {
      const y = addDays(now, -1);
      return {
        start: istStartOfDay(y.year, y.month, y.day),
        end: istEndOfDayFromParts(y.year, y.month, y.day),
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
        end: istEndOfDayFromParts(
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

export interface ResolvedRange {
  range: DateRange;
  rangeName: DateRangeName;
  rangeLabel: string;
}

export type ResolveRangeResult =
  | { ok: true; range: DateRange; rangeName: DateRangeName; rangeLabel: string }
  | { ok: false; error: string };

/**
 * Resolve a range filter from raw (untrusted) input. Returns a structured
 * error instead of throwing, so callers can surface a friendly message.
 *
 * Lives in lib/dateRange.ts so both the dashboards and the reports module
 * can use it without pulling in the database client.
 */
export function resolveDateRange(input?: {
  range?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): ResolveRangeResult {
  const rangeName = (input?.range || "today") as DateRangeName;

  if (!isDateRangeName(rangeName)) {
    return { ok: false, error: `Unknown date filter "${rangeName}".` };
  }

  let start: Date | null = null;
  let end: Date | null = null;

  if (rangeName === "custom") {
    if (input?.startDate) start = parseIstDate(input.startDate);
    if (input?.endDate) end = parseIstDate(input.endDate);

    if (
      (input?.startDate && !start) ||
      (input?.endDate && !end)
    ) {
      return { ok: false, error: "Invalid custom date. Please use valid YYYY-MM-DD dates." };
    }
    if (!start || !end) {
      return { ok: false, error: "Custom range requires both a start and an end date." };
    }
  }

  const range = getDateRange(rangeName, {
    start: input?.startDate,
    end: input?.endDate,
  });

  // Ensure the custom range covers the whole end day in IST.
  if (rangeName === "custom" && end) {
    range.end = istEndOfDay(end);
  }

  const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === rangeName)?.label ?? "Today";
  return { ok: true, range, rangeName, rangeLabel };
}
