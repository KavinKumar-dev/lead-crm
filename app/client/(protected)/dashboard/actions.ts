"use server";

import { requireClient } from "@/lib/auth";
import { computeDashboardStats, DashboardInput } from "@/lib/dashboardStats";

/**
 * Dashboard statistics for the logged-in client. Every query inside
 * computeDashboardStats is scoped to the session's clientId, which is taken
 * from requireClient() and never from the request.
 */
export async function getDashboardStats(input: DashboardInput = {}) {
  // Outside try/catch so the auth redirect can propagate.
  const session = await requireClient();
  return computeDashboardStats(session.id, input);
}
