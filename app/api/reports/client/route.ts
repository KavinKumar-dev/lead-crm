import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
import { resolveDateRange, formatIstDate } from "@/lib/dateRange";
import {
  buildClientReport,
  CLIENT_REPORT_TYPES,
  isClientReportType,
  ReportResult,
} from "@/lib/reports";
import { buildCsv, buildFileName, buildXlsx } from "@/lib/export";
import { fieldErrors, logValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Query parameters accepted by the client export route.
 *
 * NOTE: there is deliberately NO clientId parameter here. The client scope
 * is taken exclusively from the session (see requireClient below).
 */
const querySchema = z.object({
  report: z.enum(
    CLIENT_REPORT_TYPES.map((r) => r.value) as [string, ...string[]]
  ),
  range: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.enum(["csv", "xlsx"]).default("csv"),
});

/**
 * GET /api/reports/client — download a client report as CSV or XLSX.
 *
 * SECURITY: the client's data scope comes ONLY from the session cookie.
 * Any clientId in the query string is ignored entirely.
 */
export async function GET(request: Request) {
  // Outside try/catch: the auth redirect must be able to propagate.
  const session = await requireClient();

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    report: url.searchParams.get("report") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
    startDate: url.searchParams.get("startDate") ?? undefined,
    endDate: url.searchParams.get("endDate") ?? undefined,
    format: url.searchParams.get("format") ?? undefined,
  });

  if (!parsed.success) {
    logValidationError(parsed.error, "client report export");
    return NextResponse.json(
      { error: "Invalid report request.", errors: fieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { report, range, startDate, endDate, format } = parsed.data;
  if (!isClientReportType(report)) {
    return NextResponse.json({ error: "Unknown report type." }, { status: 400 });
  }

  const resolved = resolveDateRange({ range, startDate, endDate });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    // clientId comes from the session only.
    const result: ReportResult = await buildClientReport(
      report,
      session.id,
      resolved.range
    );

    const label =
      CLIENT_REPORT_TYPES.find((r) => r.value === report)?.label ?? "Report";
    const title = `${label} — ${resolved.rangeLabel} (${formatIstDate(
      resolved.range.start
    )} to ${formatIstDate(resolved.range.end)})`;

    if (format === "xlsx") {
      const buffer = await buildXlsx(
        result.columns,
        result.rows,
        title,
        result.totalRow
      );
      const fileName = buildFileName(label, resolved.rangeLabel, "xlsx");
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const csv = buildCsv(result.columns, result.rows, title, result.totalRow);
    const fileName = buildFileName(label, resolved.rangeLabel, "csv");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("client report export error:", e);
    return NextResponse.json(
      { error: "Could not generate the report. Please try again." },
      { status: 500 }
    );
  }
}
