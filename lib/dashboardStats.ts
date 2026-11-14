import { db } from "@/lib/db";
import {
  DateRange,
  formatIstDate,
  getDateRange,
  resolveDateRange,
} from "@/lib/dateRange";

export const TERMINAL_STATUSES = ["CONVERTED", "LOST"];

export interface DashboardInput {
  range?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardStats {
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

export type StatsResult =
  | { success: true; stats: DashboardStats }
  | { success: false; error: string };

export function resolveRange(
  input: DashboardInput = {}
):
  | { ok: true; range: DateRange; rangeName: string; rangeLabel: string }
  | { ok: false; error: string } {
  return resolveDateRange(input);
}

export async function computeDashboardStats(
  clientId: string | null,
  input: DashboardInput = {}
): Promise<StatsResult> {
  const resolved = resolveRange(input);
  if (!resolved.ok) return { success: false, error: resolved.error };

  try {
    const { range, rangeName, rangeLabel } = resolved;
    const scope = clientId ? { clientId } : {};
    
    const grouped = await db.lead.groupBy({
      by: ["status"],
      where: {
        ...scope,
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

    // --- Today section ---
    const todayRange = getDateRange("today");
    const [todayNew, todayFollowUps, overdueFollowUps, todayConverted, notResponding, todayLost] =
      await Promise.all([
        db.lead.count({
          where: { ...scope, createdAt: { gte: todayRange.start, lte: todayRange.end } },
        }),
        db.lead.count({
          where: { ...scope, status: { notIn: TERMINAL_STATUSES }, nextFollowUpDate: { gte: todayRange.start, lte: todayRange.end } },
        }),
        db.lead.count({
          where: { ...scope, status: { notIn: TERMINAL_STATUSES }, nextFollowUpDate: { lt: todayRange.start } },
        }),
        db.conversion.count({
          where: { ...scope, conversionDate: { gte: todayRange.start, lte: todayRange.end } },
        }),
        db.lead.count({
          where: { ...scope, status: "NOT_RESPONDING" },
        }),
        db.lead.count({
          where: { ...scope, status: "LOST", updatedAt: { gte: todayRange.start, lte: todayRange.end } },
        }),
      ]);

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
    console.error("computeDashboardStats error:", e);
    return { success: false, error: "Could not load dashboard data." };
  }
}
