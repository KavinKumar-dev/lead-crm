"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar } from "lucide-react";
import { useTransition } from "react";
import { LEAD_STATUS, LEAD_SOURCE } from "@/lib/constants";
import { leadSourceLabel, leadStatusLabel } from "@/lib/labels";

export default function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statusValue = searchParams.get("status")?.toString() || "";
  // A status filter may hold several comma-separated statuses (used by the
  // "Leads Awaiting Action" notification link).
  const isMultiStatus = statusValue.includes(",");

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name, mobile, ID..."
            defaultValue={searchParams.get("q")?.toString()}
            onChange={(e) => updateParam("q", e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            defaultValue={statusValue}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All Statuses</option>
            {isMultiStatus && (
              <option value={statusValue}>
                {statusValue
                  .split(",")
                  .map((s) => leadStatusLabel(s.trim()))
                  .join(", ")}
              </option>
            )}
            {Object.values(LEAD_STATUS).map(s => (
              <option key={s} value={s}>{leadStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            defaultValue={searchParams.get("source")?.toString()}
            onChange={(e) => updateParam("source", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All Sources</option>
            {Object.values(LEAD_SOURCE).map(s => (
              <option key={s} value={s}>{leadSourceLabel(s)}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <input
            aria-label="Start date"
            type="date"
            defaultValue={searchParams.get("startDate")?.toString()}
            onChange={(e) => updateParam("startDate", e.target.value)}
            className="w-full sm:w-auto border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
          />
          <span className="text-gray-400 text-xs sm:text-sm">to</span>
          <input
            aria-label="End date"
            type="date"
            defaultValue={searchParams.get("endDate")?.toString()}
            onChange={(e) => updateParam("endDate", e.target.value)}
            className="w-full sm:w-auto border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
