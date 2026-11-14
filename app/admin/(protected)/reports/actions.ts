"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveDateRange, formatIstDate } from "@/lib/dateRange";
import {
  ADMIN_REPORT_TYPES,
  buildAdminReport,
  isAdminReportType,
  ReportResult,
} from "@/lib/reports";

export interface AdminReportInput {
  report?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  /** Optional 5-digit Client ID filter. */
  client?: string;
}

export type AdminReportResult =
  | {
      success: true;
      report: string;
      reportLabel: string;
      rangeLabel: string;
      startDate: string;
      endDate: string;
      clientCode: string | null;
      data: ReportResult;
    }
  | { success: false; error: string };

/**
 * Preview data for an admin report.
 *
 * SECURITY: requireAdmin() runs first. The optional client filter is a
 * 5-digit Client ID resolved server-side to an internal id.
 */
export async function getAdminReport(
  input: AdminReportInput = {}
): Promise<AdminReportResult> {
  // Outside try/catch so the auth redirect can propagate.
  await requireAdmin();

  const report = input.report || ADMIN_REPORT_TYPES[0].value;
  if (!isAdminReportType(report)) {
    return { success: false, error: "Unknown report type." };
  }

  const resolved = resolveDateRange({
    range: input.range,
    startDate: input.startDate,
    endDate: input.endDate,
  });
  if (!resolved.ok) {
    return { success: false, error: resolved.error };
  }

  try {
    let clientId: string | null = null;
    const clientCode = input.client?.trim();

    if (clientCode) {
      if (!/^\d{5}$/.test(clientCode)) {
        return { success: false, error: "Client ID must be exactly 5 digits." };
      }
      const client = await db.client.findUnique({
        where: { clientCode },
        select: { id: true },
      });
      if (!client) {
        return { success: false, error: `No client found with ID ${clientCode}.` };
      }
      clientId = client.id;
    }

    const data = await buildAdminReport(report, { clientId }, resolved.range);

    return {
      success: true,
      report,
      reportLabel:
        ADMIN_REPORT_TYPES.find((r) => r.value === report)?.label ?? "Report",
      rangeLabel: resolved.rangeLabel,
      startDate: formatIstDate(resolved.range.start),
      endDate: formatIstDate(resolved.range.end),
      clientCode: clientCode || null,
      data,
    };
  } catch (e) {
    console.error("getAdminReport error:", e);
    return { success: false, error: "Could not load the report. Please try again." };
  }
}

/** Client list for the optional client filter. */
export async function getReportClientOptions() {
  await requireAdmin();
  return db.client.findMany({
    select: { id: true, clientCode: true, clientName: true },
    orderBy: { clientName: "asc" },
  });
}
