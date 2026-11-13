"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import {
  DATE_RANGE_OPTIONS,
  formatIstDate,
  getDateRange,
  isDateRangeName,
  parseIstDate,
} from "@/lib/dateRange";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TERMINAL_STATUSES = ["CONVERTED", "LOST"];

interface DashboardInput {
  range?: string;
  startDate?: string;
  endDate?: string;
}

interface DashboardStats {
  range: string;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  todayDate: string;
  kpis: {
    total: number;
    newLeads: number;
    contacted: number;
    interested: number;
    pending: number;
    converted: number;
    lost: number;
    conversionRate: number;
  };
  today: {
    newLeads: number;
    followUps: number;
    overdue: number;
    converted: number;
    pendingResponses: number;
    lost: number;
  };
}

/**
 * All numbers are computed with DB-side count/groupBy queries, always scoped
 * to the session's clientId. Returns a structured error (never throws) when
 * the input is invalid.
 */
export async function getDashboardStats(
  input: DashboardInput = {}
): Promise<{ success: true; stats: DashboardStats } | { success: false; error: string }> {
  // Outside try/catch: requireClient() must be allowed to redirect.
  const session = await requireClient();

  try {
    const rangeName = input.range || "today";

    if (!isDateRangeName(rangeName)) {
      return { success: false, error: `Unknown date filter "${rangeName}".` };
    }

    if (rangeName === "custom") {
      if ((input.startDate && !ISO_DATE_RE.test(input.startDate)) ||
          (input.endDate && !ISO_DATE_RE.test(input.endDate)) ||
          (input.startDate && !parseIstDate(input.startDate)) ||
          (input.endDate && !parseIstDate(input.endDate))) {
        return {
          success: false,
          error: "Invalid custom date. Please use valid YYYY-MM-DD dates.",
        };
      }
      if (!input.startDate || !input.endDate) {
        return {
          success: false,
          error: "Custom range requires both a start and an end date.",
        };
      }
    }

    const range = getDateRange(rangeName, {
      start: input.startDate,
      end: input.endDate,
    });

    // --- KPI counts for the selected range (single grouped query) ---
    const grouped = await db.lead.groupBy({
      by: ["status"],
      where: {
        clientId: session.id,
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: { _all: true },
    });

    const countFor = (status: string) =>
      grouped.find((g) => g.status === status)?._count._all ?? 0;

    const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
    const converted = countFor("CONVERTED");
    const lost = countFor("LOST");
    const pending = total - converted - lost;
    const conversionRate = total === 0 ? 0 : (converted / total) * 100;

    // --- Today section (ignores the selected range) ---
    const todayRange = getDateRange("today");

    const [todayNew, todayFollowUps, overdueFollowUps, todayConverted, notResponding, todayLost] =
      await Promise.all([
        db.lead.count({
          where: {
            clientId: session.id,
            createdAt: { gte: todayRange.start, lte: todayRange.end },
          },
        }),
        db.lead.count({
          where: {
            clientId: session.id,
            status: { notIn: TERMINAL_STATUSES },
            nextFollowUpDate: { gte: todayRange.start, lte: todayRange.end },
          },
        }),
        db.lead.count({
          where: {
            clientId: session.id,
            status: { notIn: TERMINAL_STATUSES },
            nextFollowUpDate: { lt: todayRange.start },
          },
        }),
        db.conversion.count({
          where: {
            clientId: session.id,
            conversionDate: { gte: todayRange.start, lte: todayRange.end },
          },
        }),
        db.lead.count({
          where: { clientId: session.id, status: "NOT_RESPONDING" },
        }),
        db.lead.count({
          where: {
            clientId: session.id,
            status: "LOST",
            updatedAt: { gte: todayRange.start, lte: todayRange.end },
          },
        }),
      ]);

    const rangeLabel =
      DATE_RANGE_OPTIONS.find((o) => o.value === rangeName)?.label ?? "Today";

    return {
      success: true,
      stats: {
        range: rangeName,
        rangeLabel,
        startDate: formatIstDate(range.start),
        endDate: formatIstDate(range.end),
        todayDate: formatIstDate(todayRange.start),
        kpis: {
          total,
          newLeads: countFor("NEW_LEAD"),
          contacted: countFor("CONTACTED"),
          interested: countFor("INTERESTED"),
          pending,
          converted,
          lost,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
        today: {
          newLeads: todayNew,
          followUps: todayFollowUps,
          overdue: overdueFollowUps,
          converted: todayConverted,
          pendingResponses: notResponding,
          lost: todayLost,
        },
      },
    };
  } catch (e) {
    console.error("getDashboardStats error:", e);
    return { success: false, error: "Could not load dashboard data. Please try again." };
  }
}
