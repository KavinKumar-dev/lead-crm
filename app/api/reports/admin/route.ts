import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveDateRange, formatIstDate } from "@/lib/dateRange";
import {
  ADMIN_REPORT_TYPES,
  buildAdminReport,
  isAdminReportType,
  ReportResult,
} from "@/lib/reports";
import { buildCsv, buildFileName, buildXlsx } from "@/lib/export";
import { fieldErrors, logValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  report: z.enum(
    ADMIN_REPORT_TYPES.map((r) => r.value) as [string, ...string[]]
  ),
  range: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  /** Optional 5-digit client filter. */
  client: z
    .string()
    .regex(/^\d{5}$/, "Client ID must be exactly 5 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  format: z.enum(["csv", "xlsx"]).default("csv"),
});

/**
 * GET /api/reports/admin — download an admin report as CSV or XLSX.
 *
 * SECURITY: requireAdmin() runs before anything else. The optional client
 * filter is resolved server-side from the 5-digit Client ID.
 */
export async function GET(request: Request) {
  // Outside try/catch: the auth redirect must be able to propagate.
  await requireAdmin();

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    report: url.searchParams.get("report") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
    startDate: url.searchParams.get("startDate") ?? undefined,
    endDate: url.searchParams.get("endDate") ?? undefined,
    client: url.searchParams.get("client") ?? undefined,
    format: url.searchParams.get("format") ?? undefined,
  });

  if (!parsed.success) {
    logValidationError(parsed.error, "admin report export");
    return NextResponse.json(
      { error: "Invalid report request.", errors: fieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const { report, range, startDate, endDate, client: clientCode, format } =
    parsed.data;
  if (!isAdminReportType(report)) {
    return NextResponse.json({ error: "Unknown report type." }, { status: 400 });
  }

  const resolved = resolveDateRange({ range, startDate, endDate });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    // Resolve the optional client filter to an internal id.
    let clientId: string | null = null;
    if (clientCode) {
      const client = await db.client.findUnique({
        where: { clientCode },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json(
          { error: "Unknown Client ID." },
          { status: 404 }
        );
      }
      clientId = client.id;
    }

    const result: ReportResult = await buildAdminReport(
      report,
      { clientId },
      resolved.range
    );

    const label =
      ADMIN_REPORT_TYPES.find((r) => r.value === report)?.label ?? "Report";
    const scopeLabel = clientCode ? `Client ${clientCode}` : "All clients";
    const title = `${label} — ${resolved.rangeLabel} — ${scopeLabel} (${formatIstDate(
      resolved.range.start
    )} to ${formatIstDate(resolved.range.end)})`;

    if (format === "xlsx") {
      const buffer = await buildXlsx(
        result.columns,
        result.rows,
        title,
        result.totalRow
      );
      const fileName = buildFileName(
        `${label} ${scopeLabel}`,
        resolved.rangeLabel,
        "xlsx"
      );
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
    const fileName = buildFileName(
      `${label} ${scopeLabel}`,
      resolved.rangeLabel,
      "csv"
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("admin report export error:", e);
    return NextResponse.json(
      { error: "Could not generate the report. Please try again." },
      { status: 500 }
    );
  }
}
