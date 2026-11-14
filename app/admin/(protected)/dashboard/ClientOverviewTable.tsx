"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, AlertTriangle, ChevronRight } from "lucide-react";
import { AdminClientRow } from "@/lib/adminTypes";

type SortKey =
  | "clientName"
  | "clientCode"
  | "total"
  | "converted"
  | "pending"
  | "lost"
  | "conversionRate"
  | "overdue";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "clientName", label: "Client" },
  { key: "clientCode", label: "Client ID" },
  { key: "total", label: "Total Leads", numeric: true },
  { key: "converted", label: "Converted", numeric: true },
  { key: "pending", label: "Pending", numeric: true },
  { key: "lost", label: "Lost", numeric: true },
  { key: "conversionRate", label: "Conversion Rate", numeric: true },
  { key: "overdue", label: "Overdue Follow-Ups", numeric: true },
];

/**
 * Sortable client overview table. Sorting is client-side (the rows are
 * already aggregated per client by the server with groupBy queries).
 */
export default function ClientOverviewTable({
  clients,
}: {
  clients: AdminClientRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [clients, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "clientName" || key === "clientCode" ? "asc" : "desc");
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 whitespace-nowrap ${col.numeric ? "text-right" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    {col.label}
                    <ArrowUpDown
                      size={12}
                      className={sortKey === col.key ? "text-blue-600" : "text-gray-300"}
                    />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row.clientId}
                  className={`transition-colors hover:bg-gray-50 ${
                    row.overdue > 0 ? "bg-orange-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{row.clientName}</span>
                    <span className="block text-xs text-gray-500">{row.businessName}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {row.clientCode}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{row.total}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {row.converted}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-orange-600">
                    {row.pending}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    {row.lost}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-teal-600">
                    {row.conversionRate}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.overdue > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                        <AlertTriangle size={12} />
                        {row.overdue}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clients/${row.clientCode}/dashboard`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
