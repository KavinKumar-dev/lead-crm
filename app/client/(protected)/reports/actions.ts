"use server";

import { requireClient } from "@/lib/auth";
import { resolveDateRange, formatIstDate } from "@/lib/dateRange";
import {
  buildClientReport,
  CLIENT_REPORT_TYPES,
  isClientReportType,
  ReportResult,
} from "@/lib/reports";
export interface ClientReportInput {
  report?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
}

export type ClientReportResult =
  | {
      success: true;
      report: string;
      reportLabel: string;
      rangeLabel: string;
      startDate: string;
      endDate: string;
      data: ReportResult;
    }
  | { success: false; error: string; errors?: Record<string, string> };

/**
 * Preview data for a client report.
 *
 * SECURITY: the client scope is taken from requireClient() only — the
 * request never supplies a clientId.
 */
export async function getClientReport(
  input: ClientReportInput = {}
): Promise<ClientReportResult> {
  // Outside try/catch so the auth redirect can propagate.
  const session = await requireClient();

  const report = input.report || CLIENT_REPORT_TYPES[0].value;
  if (!isClientReportType(report)) {
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
    const data = await buildClientReport(report, session.id, resolved.range);

    return {
      success: true,
      report,
      reportLabel:
        CLIENT_REPORT_TYPES.find((r) => r.value === report)?.label ?? "Report",
      rangeLabel: resolved.rangeLabel,
      startDate: formatIstDate(resolved.range.start),
      endDate: formatIstDate(resolved.range.end),
      data,
    };
  } catch (e) {
    console.error("getClientReport error:", e);
    return {
      success: false,
      error: "Could not load the report. Please try again.",
      errors: {},
    };
  }
}
