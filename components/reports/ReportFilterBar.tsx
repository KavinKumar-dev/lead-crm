"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export interface ReportOption {
  value: string;
  label: string;
}

export interface ReportFilterBarProps {
  reportTypes: ReportOption[];
  currentReport: string;
  /** URL of the export route, e.g. "/api/reports/client". */
  exportUrl: string;
  /** Extra query params appended to the export URL (e.g. client filter). */
  extraParams?: Record<string, string | undefined>;
  range: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Report controls: pick a report type and a date range, then download the
 * result as CSV or Excel. The report type lives in the URL so the preview
 * and the download always describe the same report.
 */
export default function ReportFilterBar({
  reportTypes,
  currentReport,
  exportUrl,
  extraParams,
  range,
  startDate,
  endDate,
}: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const buildExportUrl = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams();
    params.set("report", currentReport);
    if (range) params.set("range", range);
    if (range === "custom" && startDate) params.set("startDate", startDate);
    if (range === "custom" && endDate) params.set("endDate", endDate);
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value) params.set(key, value);
      }
    }
    params.set("format", format);
    return `${exportUrl}?${params.toString()}`;
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
      {/* Report type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Report type
        </label>
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateParam("report", type.value)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                currentReport === type.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t pt-4">
        <a
          href={buildExportUrl("csv")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <FileText size={16} />
          Download CSV
        </a>
        <a
          href={buildExportUrl("xlsx")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          <FileSpreadsheet size={16} />
          Download Excel
        </a>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
          Downloads respect the selected report and date range.
        </span>
      </div>
    </div>
  );
}
