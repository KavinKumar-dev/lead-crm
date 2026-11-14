"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { DATE_RANGE_OPTIONS } from "@/lib/dateRange";
import { Calendar } from "lucide-react";

/**
 * Date filter bar. Selection is stored in the URL query (?range=..., plus
 * startDate/endDate for custom) so it survives refresh and is shareable.
 * Shared by the client dashboard, the admin dashboard and the admin
 * per-client dashboard.
 */
export default function DateFilterBar({
  currentRange,
  startDate,
  endDate,
}: {
  currentRange: string;
  startDate?: string;
  endDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [customStart, setCustomStart] = useState(startDate ?? "");
  const [customEnd, setCustomEnd] = useState(endDate ?? "");

  const apply = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const selectRange = (value: string) => {
    if (value === "custom") {
      apply({ range: "custom" });
    } else {
      apply({ range: value, startDate: null, endDate: null });
    }
  };

  return (
    <div className="bg-white border rounded-xl p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-500 mr-1 hidden sm:inline">
          Period:
        </span>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectRange(opt.value)}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              currentRange === opt.value
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {currentRange === "custom" && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mt-3 pt-3 border-t">
          <div className="flex flex-col gap-1 w-full sm:w-auto sm:flex-1 min-w-0">
            <label htmlFor="range-start" className="text-xs text-gray-500">
              Start date
            </label>
            <input
              id="range-start"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto sm:flex-1 min-w-0">
            <label htmlFor="range-end" className="text-xs text-gray-500">
              End date
            </label>
            <input
              id="range-end"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
            />
          </div>
          <button
            type="button"
            disabled={isPending || !customStart || !customEnd}
            onClick={() => apply({ range: "custom", startDate: customStart, endDate: customEnd })}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 min-h-[44px] bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Calendar size={16} />
            {isPending ? "Applying..." : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}
