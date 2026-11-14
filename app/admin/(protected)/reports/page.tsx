import { getAdminReport, getReportClientOptions } from "./actions";
import AdminReportClientFilter from "./AdminReportClientFilter";
import DateFilterBar from "@/components/dashboard/DateFilterBar";
import ReportFilterBar from "@/components/reports/ReportFilterBar";
import ReportPreview from "@/components/reports/ReportPreview";
import { ADMIN_REPORT_TYPES } from "@/lib/reports";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: {
    report?: string;
    range?: string;
    startDate?: string;
    endDate?: string;
    client?: string;
  };
}) {
  const report = searchParams.report || ADMIN_REPORT_TYPES[0].value;
  const range = searchParams.range || "today";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;
  const client = searchParams.client;

  const [result, clients] = await Promise.all([
    getAdminReport({
      report,
      range: searchParams.range,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      client,
    }),
    getReportClientOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">
          Overall and client-wise performance reports across all clients.
        </p>
      </div>

      <ReportFilterBar
        reportTypes={ADMIN_REPORT_TYPES.map((r) => ({ ...r }))}
        currentReport={report}
        exportUrl="/api/reports/admin"
        extraParams={{ client }}
        range={range}
        startDate={startDate}
        endDate={endDate}
      />

      <AdminReportClientFilter clients={clients} />

      <DateFilterBar currentRange={range} startDate={startDate} endDate={endDate} />

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{result.error}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{result.reportLabel}</span>
            <span>·</span>
            <span>
              {result.rangeLabel} ({result.startDate} to {result.endDate})
            </span>
            {result.clientCode && (
              <>
                <span>·</span>
                <span>Client {result.clientCode}</span>
              </>
            )}
          </div>

          <ReportPreview
            columns={result.data.columns}
            rows={result.data.rows}
            totalRows={result.data.totalRows}
            truncated={result.data.truncated}
            totalRow={result.data.totalRow}
          />
        </>
      )}
    </div>
  );
}
