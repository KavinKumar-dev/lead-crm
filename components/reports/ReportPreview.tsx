import { ReportColumn, ReportRow } from "@/lib/reports";
import { AlertTriangle, Inbox } from "lucide-react";

/**
 * Preview table for a report. Renders at most `maxRows` rows so a large
 * report never floods the page.
 */
export default function ReportPreview({
  columns,
  rows,
  totalRows,
  truncated,
  totalRow,
  maxRows = 50,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  totalRows: number;
  truncated: boolean;
  totalRow?: ReportRow;
  maxRows?: number;
}) {
  if (columns.length === 0) {
    return (
      <div className="bg-white border rounded-xl shadow-sm p-8 text-center text-gray-500">
        Select a report type to preview it.
      </div>
    );
  }

  const visible = rows.slice(0, maxRows);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-gray-800">Preview</h2>
        <span className="text-xs text-gray-500">
          {totalRows} row{totalRows === 1 ? "" : "s"}
          {rows.length > visible.length
            ? ` — showing first ${visible.length}`
            : ""}
        </span>
      </div>

      {truncated && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle size={14} />
          The result was capped at 10,000 rows. Narrow the date range for a
          complete picture.
        </div>
      )}

      {visible.length === 0 ? (
        <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
          <Inbox size={28} className="text-gray-300" />
          <p>No data for the selected report and date range.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 font-medium">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => {
                    const value = row[col.key];
                    const isNumber = typeof value === "number";
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 whitespace-nowrap ${
                          isNumber ? "text-right font-medium" : "text-gray-700"
                        }`}
                      >
                        {value === null || value === undefined || value === ""
                          ? "—"
                          : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {totalRow && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 font-bold">
                  {columns.map((col) => {
                    const value = totalRow[col.key];
                    const isNumber = typeof value === "number";
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 whitespace-nowrap ${
                          isNumber ? "text-right" : "text-gray-900"
                        }`}
                      >
                        {value === null || value === undefined || value === ""
                          ? "—"
                          : value}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
