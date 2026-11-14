/**
 * Shared report definitions and data builders.
 *
 * Every report is produced with database-side aggregation (groupBy /
 * raw GROUP BY) — rows are never loaded wholesale into memory. The
 * row-oriented reports (conversion, lost leads, follow-ups) use a bounded
 * SELECT with a hard LIMIT so a huge dataset can never exhaust memory.
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  DateRange,
  eachIstDayInRange,
  formatIstDate,
  IST_OFFSET_MINUTES,
} from "@/lib/dateRange";
import {
  followUpEventLabel,
  followUpStageLabel,
  isTerminalEvent,
  leadSourceLabel,
  leadStatusLabel,
} from "@/lib/labels";

/** Hard cap on the number of rows a single export may contain. */
export const MAX_EXPORT_ROWS = 10000;

export const CLIENT_REPORT_TYPES = [
  { value: "daily_leads", label: "Daily Lead Report" },
  { value: "weekly_leads", label: "Weekly Lead Report" },
  { value: "monthly_leads", label: "Monthly Lead Report" },
  { value: "follow_ups", label: "Follow-Up Report" },
  { value: "conversions", label: "Conversion Report" },
  { value: "lost_leads", label: "Lost Lead Report" },
] as const;

export const ADMIN_REPORT_TYPES = [
  { value: "overall_lead_generation", label: "Overall Lead Generation Report" },
  { value: "client_performance", label: "Client-Wise Performance Report" },
  { value: "date_wise_leads", label: "Date-Wise Lead Report" },
  { value: "client_wise_conversion", label: "Client-Wise Conversion Report" },
  { value: "overall_conversion_rate", label: "Overall Conversion Rate" },
] as const;

export type ClientReportType = (typeof CLIENT_REPORT_TYPES)[number]["value"];
export type AdminReportType = (typeof ADMIN_REPORT_TYPES)[number]["value"];

export function isClientReportType(value: unknown): value is ClientReportType {
  return CLIENT_REPORT_TYPES.some((r) => r.value === value);
}

export function isAdminReportType(value: unknown): value is AdminReportType {
  return ADMIN_REPORT_TYPES.some((r) => r.value === value);
}

/** A single report column. */
export interface ReportColumn {
  key: string;
  label: string;
  /** Column width hint for the preview table (characters). */
  width?: number;
  /** Long free-text columns are wrapped instead of widened in Excel. */
  wrap?: boolean;
}

/** A report row: column key -> cell value. */
export type ReportRow = Record<string, string | number | null>;

export interface ReportResult {
  columns: ReportColumn[];
  rows: ReportRow[];
  /** Total rows available in the database (may exceed `rows.length`). */
  totalRows: number;
  /** True when the result was truncated at MAX_EXPORT_ROWS. */
  truncated: boolean;
  /**
   * Optional summary row rendered at the very bottom of the report
   * (CSV + Excel). The conversion rate is derived from the totals, never
   * from an average of the per-period rates.
   */
  totalRow?: ReportRow;
}

const EMPTY: ReportResult = {
  columns: [],
  rows: [],
  totalRows: 0,
  truncated: false,
};

/* ------------------------------------------------------------------ */
/* Column definitions                                                  */
/* ------------------------------------------------------------------ */

const CLIENT_LEAD_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "total", label: "Total Leads" },
  { key: "newLeads", label: "New Leads" },
  { key: "contacted", label: "Contacted" },
  { key: "interested", label: "Interested" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "conversionRate", label: "Conversion Rate (%)" },
];

const FOLLOW_UP_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "event", label: "Event" },
  { key: "leadCode", label: "Lead ID" },
  { key: "name", label: "Customer" },
  { key: "mobile", label: "Mobile" },
  { key: "stage", label: "Stage" },
  { key: "status", label: "Status" },
  { key: "customerResponse", label: "Customer Response", wrap: true },
  { key: "note", label: "Notes", wrap: true },
  { key: "nextFollowUpDate", label: "Next Follow-Up" },
  { key: "updatedBy", label: "Updated By" },
];

const CONVERSION_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "leadCode", label: "Lead ID" },
  { key: "customerName", label: "Customer" },
  { key: "contactNumber", label: "Contact" },
  { key: "productService", label: "Product / Service" },
  { key: "orderValue", label: "Order Value" },
  { key: "remarks", label: "Remarks", wrap: true },
];

const LOST_LEAD_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "leadCode", label: "Lead ID" },
  { key: "name", label: "Customer" },
  { key: "mobile", label: "Mobile" },
  { key: "source", label: "Source" },
  { key: "campaignName", label: "Campaign" },
  { key: "lostReason", label: "Lost Reason" },
  { key: "remarks", label: "Remarks", wrap: true },
];

const ADMIN_GENERATION_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "total", label: "Total Leads" },
  { key: "newLeads", label: "New Leads" },
  { key: "contacted", label: "Contacted" },
  { key: "interested", label: "Interested" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "conversionRate", label: "Conversion Rate (%)" },
];

const ADMIN_CLIENT_PERFORMANCE_COLUMNS: ReportColumn[] = [
  { key: "clientName", label: "Client" },
  { key: "clientCode", label: "Client ID" },
  { key: "businessName", label: "Business" },
  { key: "total", label: "Total Leads" },
  { key: "newLeads", label: "New Leads" },
  { key: "contacted", label: "Contacted" },
  { key: "interested", label: "Interested" },
  { key: "pending", label: "Pending" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "conversionRate", label: "Conversion Rate (%)" },
];

const ADMIN_DATE_WISE_COLUMNS: ReportColumn[] = [
  { key: "date", label: "Date" },
  { key: "clientName", label: "Client" },
  { key: "clientCode", label: "Client ID" },
  { key: "total", label: "Total Leads" },
  { key: "newLeads", label: "New Leads" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
];

const ADMIN_CLIENT_CONVERSION_COLUMNS: ReportColumn[] = [
  { key: "clientName", label: "Client" },
  { key: "clientCode", label: "Client ID" },
  { key: "totalLeads", label: "Total Leads" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "conversionRate", label: "Conversion Rate (%)" },
  { key: "totalOrderValue", label: "Total Order Value" },
];

const ADMIN_OVERALL_RATE_COLUMNS: ReportColumn[] = [
  { key: "metric", label: "Metric" },
  { key: "value", label: "Value" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function rate(converted: number, total: number): number {
  return total === 0 ? 0 : Math.round((converted / total) * 1000) / 10;
}

/** Format a Date as an IST "YYYY-MM-DD" string. */
function istDate(date: Date | null | undefined): string {
  if (!date) return "";
  return formatIstDate(date);
}

/**
 * Builds the SQL expression that buckets a timestamp column into an IST
 * calendar date. `bucket` is one of "day" | "week" | "month".
 *
 * The column holds UTC; IST is a fixed +05:30 offset (no daylight saving),
 * so the shift is a constant interval. PostgreSQL has no `strftime`, the
 * equivalent is `to_char()`.
 */
function bucketExpr(column: string, bucket: "day" | "week" | "month"): string {
  const shifted = `(${column} + INTERVAL '${IST_OFFSET_MINUTES} minutes')`;
  switch (bucket) {
    case "week":
      // ISO week label: 2026-W45
      return `to_char(${shifted}, 'IYYY-"W"IW')`;
    case "month":
      return `to_char(${shifted}, 'YYYY-MM')`;
    default:
      return `to_char(${shifted}, 'YYYY-MM-DD')`;
  }
}

/** The zeroed counters used for a period that has no activity. */
function emptyBucketRow(label: string): ReportRow {
  return {
    date: label,
    total: 0,
    newLeads: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
  };
}

/**
 * Fill in every calendar day of the range so days without activity still
 * appear (with zero counts). Only applied to the daily report.
 */
function fillEmptyDays(rows: ReportRow[], range: DateRange): ReportRow[] {
  const byDay = new Map(rows.map((r) => [String(r.date), r]));
  const days = eachIstDayInRange(range);

  // Cap the fill so a very wide custom range cannot explode the report.
  const capped = days.slice(0, MAX_EXPORT_ROWS);
  return capped.map((day) => byDay.get(day) ?? emptyBucketRow(day));
}

/**
 * Build the TOTAL row for a bucketed report. The conversion rate is derived
 * from the summed totals — never from an average of the per-period rates.
 */
function buildTotalRow(rows: ReportRow[]): ReportRow {
  const sum = (key: string) =>
    rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

  const total = sum("total");
  const converted = sum("converted");

  return {
    date: "TOTAL",
    total,
    newLeads: sum("newLeads"),
    contacted: sum("contacted"),
    interested: sum("interested"),
    converted,
    lost: sum("lost"),
    conversionRate: rate(converted, total),
  };
}

/* ------------------------------------------------------------------ */
/* Client reports                                                      */
/* ------------------------------------------------------------------ */

/**
 * Date-bucketed lead counts (daily / weekly / monthly) for one client.
 * Aggregation happens in SQL; only the grouped result comes back.
 */
async function clientBucketedReport(
  clientId: string,
  bucket: "day" | "week" | "month",
  range: DateRange
): Promise<ReportResult> {
  const expr = bucketExpr(`"Lead"."createdAt"`, bucket);

  const rows = await db.$queryRaw<
    {
      bucket: string | null;
      total: bigint;
      newLeads: bigint;
      contacted: bigint;
      interested: bigint;
      converted: bigint;
      lost: bigint;
    }[]
  >`
    SELECT
      ${Prisma.raw(expr)} AS bucket,
      COUNT(*) AS total,
      SUM(CASE WHEN "Lead"."status" = 'NEW_LEAD' THEN 1 ELSE 0 END) AS "newLeads",
      SUM(CASE WHEN "Lead"."status" = 'CONTACTED' THEN 1 ELSE 0 END) AS contacted,
      SUM(CASE WHEN "Lead"."status" = 'INTERESTED' THEN 1 ELSE 0 END) AS interested,
      SUM(CASE WHEN "Lead"."status" = 'CONVERTED' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN "Lead"."status" = 'LOST' THEN 1 ELSE 0 END) AS lost
    FROM "Lead"
    WHERE "Lead"."clientId" = ${clientId}
      AND "Lead"."createdAt" >= ${range.start}
      AND "Lead"."createdAt" <= ${range.end}
    GROUP BY bucket
    ORDER BY bucket ASC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => {
    const total = Number(r.total);
    const converted = Number(r.converted);
    return {
      date: r.bucket ?? "",
      total,
      newLeads: Number(r.newLeads),
      contacted: Number(r.contacted),
      interested: Number(r.interested),
      converted,
      lost: Number(r.lost),
      conversionRate: rate(converted, total),
    };
  });

  // The daily report lists every day of the range, including days without
  // any activity (zero counts).
  const filled = bucket === "day" ? fillEmptyDays(result, range) : result;

  return {
    columns: CLIENT_LEAD_COLUMNS,
    rows: filled,
    totalRows: filled.length,
    truncated: filled.length >= MAX_EXPORT_ROWS,
    totalRow: buildTotalRow(filled),
  };
}

/** Follow-up activity for one client. */
async function clientFollowUpReport(
  clientId: string,
  range: DateRange
): Promise<ReportResult> {
  const rows = await db.$queryRaw<
    {
      createdAt: Date;
      time: string | null;
      leadCode: string;
      name: string;
      mobile: string;
      stage: string;
      status: string;
      customerResponse: string | null;
      note: string | null;
      nextFollowUpDate: Date | null;
      updatedBy: string | null;
    }[]
  >`
    SELECT
      "FollowUp"."createdAt" AS "createdAt",
      to_char(("FollowUp"."createdAt" + INTERVAL '${IST_OFFSET_MINUTES} minutes'), 'HH24:MI') AS "time",
      "Lead"."leadCode" AS "leadCode",
      "Lead"."name" AS name,
      "Lead"."mobile" AS mobile,
      "FollowUp"."stage" AS stage,
      "FollowUp"."status" AS status,
      "FollowUp"."customerResponse" AS "customerResponse",
      "FollowUp"."note" AS note,
      "FollowUp"."nextFollowUpDate" AS "nextFollowUpDate",
      COALESCE(
        "UpdaterClient"."clientName",
        "UpdaterUser"."name",
        "FollowUp"."updatedByRole"
      ) AS "updatedBy"
    FROM "FollowUp"
    JOIN "Lead" ON "Lead"."id" = "FollowUp"."leadId"
    LEFT JOIN "Client" AS "UpdaterClient"
      ON "FollowUp"."updatedByRole" = 'CLIENT'
      AND "UpdaterClient"."id" = "FollowUp"."updatedById"
    LEFT JOIN "User" AS "UpdaterUser"
      ON "FollowUp"."updatedByRole" = 'ADMIN'
      AND "UpdaterUser"."id" = "FollowUp"."updatedById"
    WHERE "FollowUp"."clientId" = ${clientId}
      AND "FollowUp"."createdAt" >= ${range.start}
      AND "FollowUp"."createdAt" <= ${range.end}
    ORDER BY "FollowUp"."createdAt" DESC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => {
    const isEvent = isTerminalEvent(r.status);
    return {
      date: istDate(r.createdAt),
      time: r.time ?? "",
      // A converted / lost record is an event, not a regular follow-up.
      event: followUpEventLabel(r.status),
      leadCode: r.leadCode,
      name: r.name,
      mobile: r.mobile,
      // Converted / Lost events have no meaningful stage.
      stage: isEvent ? "" : followUpStageLabel(r.stage),
      status: isEvent ? followUpEventLabel(r.status) : leadStatusLabel(r.status),
      customerResponse: r.customerResponse ?? "",
      note: r.note ?? "",
      nextFollowUpDate: r.nextFollowUpDate ? istDate(r.nextFollowUpDate) : "",
      updatedBy: r.updatedBy ?? "",
    };
  });

  return {
    columns: FOLLOW_UP_COLUMNS,
    rows: result,
    totalRows: result.length,
    truncated: result.length >= MAX_EXPORT_ROWS,
  };
}

/** Conversions for one client. */
async function clientConversionReport(
  clientId: string,
  range: DateRange
): Promise<ReportResult> {
  const rows = await db.$queryRaw<
    {
      conversionDate: Date;
      leadCode: string;
      customerName: string;
      contactNumber: string;
      productService: string;
      orderValue: number | null;
      remarks: string | null;
    }[]
  >`
    SELECT
      "Conversion"."conversionDate" AS "conversionDate",
      "Lead"."leadCode" AS "leadCode",
      "Conversion"."customerName" AS "customerName",
      "Conversion"."contactNumber" AS "contactNumber",
      "Conversion"."productService" AS "productService",
      "Conversion"."orderValue" AS "orderValue",
      "Conversion"."remarks" AS remarks
    FROM "Conversion"
    JOIN "Lead" ON "Lead"."id" = "Conversion"."leadId"
    WHERE "Conversion"."clientId" = ${clientId}
      AND "Conversion"."conversionDate" >= ${range.start}
      AND "Conversion"."conversionDate" <= ${range.end}
    ORDER BY "Conversion"."conversionDate" DESC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => ({
    date: istDate(r.conversionDate),
    leadCode: r.leadCode,
    customerName: r.customerName,
    contactNumber: r.contactNumber,
    productService: r.productService,
    orderValue: r.orderValue ?? 0,
    remarks: r.remarks ?? "",
  }));

  return {
    columns: CONVERSION_COLUMNS,
    rows: result,
    totalRows: result.length,
    truncated: result.length >= MAX_EXPORT_ROWS,
  };
}

/** Lost leads for one client (based on when they were marked lost). */
async function clientLostLeadReport(
  clientId: string,
  range: DateRange
): Promise<ReportResult> {
  const rows = await db.$queryRaw<
    {
      updatedAt: Date;
      leadCode: string;
      name: string;
      mobile: string;
      source: string;
      campaignName: string;
      lostReason: string | null;
      remarks: string | null;
    }[]
  >`
    SELECT
      "Lead"."updatedAt" AS "updatedAt",
      "Lead"."leadCode" AS "leadCode",
      "Lead"."name" AS name,
      "Lead"."mobile" AS mobile,
      "Lead"."source" AS source,
      "Lead"."campaignName" AS "campaignName",
      "Lead"."lostReason" AS "lostReason",
      "Lead"."remarks" AS remarks
    FROM "Lead"
    WHERE "Lead"."clientId" = ${clientId}
      AND "Lead"."status" = 'LOST'
      AND "Lead"."updatedAt" >= ${range.start}
      AND "Lead"."updatedAt" <= ${range.end}
    ORDER BY "Lead"."updatedAt" DESC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => ({
    date: istDate(r.updatedAt),
    leadCode: r.leadCode,
    name: r.name,
    mobile: r.mobile,
    source: leadSourceLabel(r.source),
    campaignName: r.campaignName,
    lostReason: r.lostReason ?? "",
    remarks: r.remarks ?? "",
  }));

  return {
    columns: LOST_LEAD_COLUMNS,
    rows: result,
    totalRows: result.length,
    truncated: result.length >= MAX_EXPORT_ROWS,
  };
}

/**
 * Build a client report. The caller is responsible for scoping `clientId`
 * to the authenticated session.
 */
export async function buildClientReport(
  report: ClientReportType,
  clientId: string,
  range: DateRange
): Promise<ReportResult> {
  switch (report) {
    case "daily_leads":
      return clientBucketedReport(clientId, "day", range);
    case "weekly_leads":
      return clientBucketedReport(clientId, "week", range);
    case "monthly_leads":
      return clientBucketedReport(clientId, "month", range);
    case "follow_ups":
      return clientFollowUpReport(clientId, range);
    case "conversions":
      return clientConversionReport(clientId, range);
    case "lost_leads":
      return clientLostLeadReport(clientId, range);
    default:
      return EMPTY;
  }
}

/* ------------------------------------------------------------------ */
/* Admin reports                                                       */
/* ------------------------------------------------------------------ */

/** Optional client filter for admin reports (null = all clients). */
export interface AdminReportScope {
  /** Internal client id, or null for "all clients". */
  clientId: string | null;
}

/** Date-bucketed lead generation across the selected scope. */
async function adminOverallGeneration(
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  const expr = bucketExpr(`"Lead"."createdAt"`, "day");
  const clientFilter = scope.clientId
    ? Prisma.sql`AND "Lead"."clientId" = ${scope.clientId}`
    : Prisma.empty;

  const rows = await db.$queryRaw<
    {
      bucket: string | null;
      total: bigint;
      newLeads: bigint;
      contacted: bigint;
      interested: bigint;
      converted: bigint;
      lost: bigint;
    }[]
  >`
    SELECT
      ${Prisma.raw(expr)} AS bucket,
      COUNT(*) AS total,
      SUM(CASE WHEN "Lead"."status" = 'NEW_LEAD' THEN 1 ELSE 0 END) AS "newLeads",
      SUM(CASE WHEN "Lead"."status" = 'CONTACTED' THEN 1 ELSE 0 END) AS contacted,
      SUM(CASE WHEN "Lead"."status" = 'INTERESTED' THEN 1 ELSE 0 END) AS interested,
      SUM(CASE WHEN "Lead"."status" = 'CONVERTED' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN "Lead"."status" = 'LOST' THEN 1 ELSE 0 END) AS lost
    FROM "Lead"
    WHERE "Lead"."createdAt" >= ${range.start}
      AND "Lead"."createdAt" <= ${range.end}
      ${clientFilter}
    GROUP BY bucket
    ORDER BY bucket ASC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => {
    const total = Number(r.total);
    const converted = Number(r.converted);
    return {
      date: r.bucket ?? "",
      total,
      newLeads: Number(r.newLeads),
      contacted: Number(r.contacted),
      interested: Number(r.interested),
      converted,
      lost: Number(r.lost),
      conversionRate: rate(converted, total),
    };
  });

  // List every day of the range, including days without any activity.
  const filled = fillEmptyDays(result, range);

  return {
    columns: ADMIN_GENERATION_COLUMNS,
    rows: filled,
    totalRows: filled.length,
    truncated: filled.length >= MAX_EXPORT_ROWS,
    totalRow: buildTotalRow(filled),
  };
}

/** Per-client performance summary. */
async function adminClientPerformance(
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  const grouped = await db.lead.groupBy({
    by: ["clientId", "status"],
    where: {
      ...(scope.clientId ? { clientId: scope.clientId } : {}),
      createdAt: { gte: range.start, lte: range.end },
    },
    _count: { _all: true },
  });

  const clients = await db.client.findMany({
    where: scope.clientId ? { id: scope.clientId } : undefined,
    select: { id: true, clientCode: true, clientName: true, businessName: true },
    orderBy: { clientName: "asc" },
  });

  const rows: ReportRow[] = clients.map((client) => {
    const mine = grouped.filter((g) => g.clientId === client.id);
    const countFor = (status: string) =>
      mine.find((g) => g.status === status)?._count._all ?? 0;

    const total = mine.reduce((sum, g) => sum + g._count._all, 0);
    const converted = countFor("CONVERTED");
    const lost = countFor("LOST");

    return {
      clientName: client.clientName,
      clientCode: client.clientCode,
      businessName: client.businessName,
      total,
      newLeads: countFor("NEW_LEAD"),
      contacted: countFor("CONTACTED"),
      interested: countFor("INTERESTED"),
      pending: total - converted - lost,
      converted,
      lost,
      conversionRate: rate(converted, total),
    };
  });

  return {
    columns: ADMIN_CLIENT_PERFORMANCE_COLUMNS,
    rows,
    totalRows: rows.length,
    truncated: false,
  };
}

/** Date-wise lead counts per client. */
async function adminDateWiseLeads(
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  const expr = bucketExpr(`"Lead"."createdAt"`, "day");
  const clientFilter = scope.clientId
    ? Prisma.sql`AND "Lead"."clientId" = ${scope.clientId}`
    : Prisma.empty;

  const rows = await db.$queryRaw<
    {
      bucket: string | null;
      clientId: string;
      clientName: string;
      clientCode: string;
      total: bigint;
      newLeads: bigint;
      converted: bigint;
      lost: bigint;
    }[]
  >`
    SELECT
      ${Prisma.raw(expr)} AS bucket,
      "Lead"."clientId" AS "clientId",
      "Client"."clientName" AS "clientName",
      "Client"."clientCode" AS "clientCode",
      COUNT(*) AS total,
      SUM(CASE WHEN "Lead"."status" = 'NEW_LEAD' THEN 1 ELSE 0 END) AS "newLeads",
      SUM(CASE WHEN "Lead"."status" = 'CONVERTED' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN "Lead"."status" = 'LOST' THEN 1 ELSE 0 END) AS lost
    FROM "Lead"
    JOIN "Client" ON "Client"."id" = "Lead"."clientId"
    WHERE "Lead"."createdAt" >= ${range.start}
      AND "Lead"."createdAt" <= ${range.end}
      ${clientFilter}
    GROUP BY bucket, "Lead"."clientId", "Client"."clientName", "Client"."clientCode"
    ORDER BY bucket ASC, "Client"."clientName" ASC
    LIMIT ${MAX_EXPORT_ROWS}
  `;

  const result: ReportRow[] = rows.map((r) => ({
    date: r.bucket ?? "",
    clientName: r.clientName,
    clientCode: r.clientCode,
    total: Number(r.total),
    newLeads: Number(r.newLeads),
    converted: Number(r.converted),
    lost: Number(r.lost),
  }));

  return {
    columns: ADMIN_DATE_WISE_COLUMNS,
    rows: result,
    totalRows: result.length,
    truncated: result.length >= MAX_EXPORT_ROWS,
  };
}

/** Conversion performance per client (including order value). */
async function adminClientConversion(
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  const [leadGroup, conversions] = await Promise.all([
    db.lead.groupBy({
      by: ["clientId", "status"],
      where: {
        ...(scope.clientId ? { clientId: scope.clientId } : {}),
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: { _all: true },
    }),
    db.conversion.groupBy({
      by: ["clientId"],
      where: {
        ...(scope.clientId ? { clientId: scope.clientId } : {}),
        conversionDate: { gte: range.start, lte: range.end },
      },
      _sum: { orderValue: true },
      _count: { _all: true },
    }),
  ]);

  const clients = await db.client.findMany({
    where: scope.clientId ? { id: scope.clientId } : undefined,
    select: { id: true, clientCode: true, clientName: true },
    orderBy: { clientName: "asc" },
  });

  const rows: ReportRow[] = clients.map((client) => {
    const mine = leadGroup.filter((g) => g.clientId === client.id);
    const countFor = (status: string) =>
      mine.find((g) => g.status === status)?._count._all ?? 0;

    const totalLeads = mine.reduce((sum, g) => sum + g._count._all, 0);
    const converted = countFor("CONVERTED");
    const lost = countFor("LOST");
    const conv = conversions.find((c) => c.clientId === client.id);

    return {
      clientName: client.clientName,
      clientCode: client.clientCode,
      totalLeads,
      converted,
      lost,
      conversionRate: rate(converted, totalLeads),
      totalOrderValue: conv?._sum.orderValue ?? 0,
    };
  });

  return {
    columns: ADMIN_CLIENT_CONVERSION_COLUMNS,
    rows,
    totalRows: rows.length,
    truncated: false,
  };
}

/** Overall conversion-rate summary for the selected scope. */
async function adminOverallConversionRate(
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  const [grouped, conversionAgg] = await Promise.all([
    db.lead.groupBy({
      by: ["status"],
      where: {
        ...(scope.clientId ? { clientId: scope.clientId } : {}),
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: { _all: true },
    }),
    db.conversion.aggregate({
      where: {
        ...(scope.clientId ? { clientId: scope.clientId } : {}),
        conversionDate: { gte: range.start, lte: range.end },
      },
      _sum: { orderValue: true },
      _count: { _all: true },
    }),
  ]);

  const countFor = (status: string) =>
    grouped.find((g) => g.status === status)?._count._all ?? 0;

  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const converted = countFor("CONVERTED");
  const lost = countFor("LOST");

  const rows: ReportRow[] = [
    { metric: "Total Leads", value: total },
    { metric: "New Leads", value: countFor("NEW_LEAD") },
    { metric: "Contacted", value: countFor("CONTACTED") },
    { metric: "Interested", value: countFor("INTERESTED") },
    { metric: "Pending", value: total - converted - lost },
    { metric: "Converted", value: converted },
    { metric: "Lost", value: lost },
    { metric: "Conversion Rate (%)", value: rate(converted, total) },
    { metric: "Total Conversions", value: conversionAgg._count._all },
    { metric: "Total Order Value", value: conversionAgg._sum.orderValue ?? 0 },
  ];

  return {
    columns: ADMIN_OVERALL_RATE_COLUMNS,
    rows,
    totalRows: rows.length,
    truncated: false,
  };
}

/** Build an admin report for the given scope. */
export async function buildAdminReport(
  report: AdminReportType,
  scope: AdminReportScope,
  range: DateRange
): Promise<ReportResult> {
  switch (report) {
    case "overall_lead_generation":
      return adminOverallGeneration(scope, range);
    case "client_performance":
      return adminClientPerformance(scope, range);
    case "date_wise_leads":
      return adminDateWiseLeads(scope, range);
    case "client_wise_conversion":
      return adminClientConversion(scope, range);
    case "overall_conversion_rate":
      return adminOverallConversionRate(scope, range);
    default:
      return EMPTY;
  }
}
