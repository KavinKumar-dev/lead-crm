"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  computeDashboardStats,
  DashboardInput,
  DashboardStats,
  resolveRange,
  TERMINAL_STATUSES,
} from "@/lib/dashboardStats";
import { getDateRange } from "@/lib/dateRange";
import { AdminClientRow } from "@/lib/adminTypes";

export interface AdminDashboardData {
  stats: DashboardStats;
  clients: AdminClientRow[];
  chart: { name: string; converted: number; total: number }[];
}

/**
 * Overall admin dashboard data.
 *
 * - The KPI / Today numbers come from the shared computeDashboardStats()
 *   helper with a null clientId (all clients).
 * - The client overview table is built with groupBy() queries (never by
 *   loading leads into memory) and respects the selected date range.
 */
export async function getAdminDashboard(
  input: DashboardInput = {}
): Promise<
  | { success: true; data: AdminDashboardData }
  | { success: false; error: string }
> {
  // Outside try/catch so the auth redirect can propagate.
  await requireAdmin();

  try {
    const resolved = resolveRange(input);
    if (!resolved.ok) return { success: false, error: resolved.error };
    const { range } = resolved;

    const overall = await computeDashboardStats(null, input);
    if (!overall.success) return { success: false, error: overall.error };

    const todayRange = getDateRange("today");

    const [clients, byStatus, overdueByClient] = await Promise.all([
      db.client.findMany({
        select: {
          id: true,
          clientCode: true,
          clientName: true,
          businessName: true,
          status: true,
        },
        orderBy: { clientName: "asc" },
      }),
      // Counts per client per status inside the selected range.
      db.lead.groupBy({
        by: ["clientId", "status"],
        where: { createdAt: { gte: range.start, lte: range.end } },
        _count: { _all: true },
      }),
      // Overdue follow-ups per client. This is a live metric (current pending
      // follow-ups), matching the "Today" section on the client dashboard;
      // the lead counts above respect the selected date range.
      db.lead.groupBy({
        by: ["clientId"],
        where: {
          status: { notIn: TERMINAL_STATUSES },
          nextFollowUpDate: { lt: todayRange.start },
        },
        _count: { _all: true },
      }),
    ]);

    const rows: AdminClientRow[] = clients.map((client) => {
      const mine = byStatus.filter((g) => g.clientId === client.id);
      const countFor = (status: string) =>
        mine.find((g) => g.status === status)?._count._all ?? 0;

      const total = mine.reduce((sum, g) => sum + g._count._all, 0);
      const converted = countFor("CONVERTED");
      const lost = countFor("LOST");
      const pending = total - converted - lost;

      return {
        clientId: client.id,
        clientCode: client.clientCode,
        clientName: client.clientName,
        businessName: client.businessName,
        status: client.status,
        total,
        converted,
        pending,
        lost,
        conversionRate:
          total === 0 ? 0 : Math.round((converted / total) * 1000) / 10,
        overdue:
          overdueByClient.find((g) => g.clientId === client.id)?._count._all ?? 0,
      };
    });

    const chart = rows.map((row) => ({
      name: row.clientName,
      converted: row.converted,
      total: row.total,
    }));

    return {
      success: true,
      data: { stats: overall.stats, clients: rows, chart },
    };
  } catch (e) {
    console.error("getAdminDashboard error:", e);
    return { success: false, error: "Could not load dashboard data." };
  }
}

/** Simple client list used by the "Switch client" box and admin filters. */
export async function getClientDirectory() {
  await requireAdmin();
  return db.client.findMany({
    select: { id: true, clientCode: true, clientName: true, businessName: true },
    orderBy: { clientName: "asc" },
  });
}
