"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar, X } from "lucide-react";
import { useTransition } from "react";
import { LEAD_STATUS, LEAD_SOURCE, FOLLOW_UP_STAGE } from "@/lib/constants";
import {
  followUpStageLabel,
  leadSourceLabel,
  leadStatusLabel,
} from "@/lib/labels";

interface ClientOption {
  id: string;
  clientCode: string;
  clientName: string;
}

/**
 * Filters for the admin "All Leads" page. Every filter is stored in the URL
 * so results stay shareable and survive a refresh.
 */
export default function AdminLeadFilters({
  clients,
}: {
  clients: ClientOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // reset to page 1 on filter change

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  const hasFilters =
    ["q", "client", "status", "stage", "source", "startDate", "endDate", "followUp"].some(
      (key) => searchParams.get(key)
    );

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} />
          Filters
          {isPending && (
            <span className="text-xs text-gray-400 font-normal">updating…</span>
          )}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Name, mobile, Lead ID..."
            defaultValue={searchParams.get("q")?.toString()}
            onChange={(e) => updateParam("q", e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Client */}
        <div>
          <select
            defaultValue={searchParams.get("client")?.toString() || ""}
            onChange={(e) => updateParam("client", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.clientCode}>
                {c.clientName} ({c.clientCode})
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            defaultValue={searchParams.get("status")?.toString() || ""}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            {Object.values(LEAD_STATUS).map((s) => (
              <option key={s} value={s}>
                {leadStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Follow-up stage */}
        <div>
          <select
            defaultValue={searchParams.get("stage")?.toString() || ""}
            onChange={(e) => updateParam("stage", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Stages</option>
            {Object.values(FOLLOW_UP_STAGE).map((s) => (
              <option key={s} value={s}>
                {followUpStageLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <select
            defaultValue={searchParams.get("source")?.toString() || ""}
            onChange={(e) => updateParam("source", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Sources</option>
            {Object.values(LEAD_SOURCE).map((s) => (
              <option key={s} value={s}>
                {leadSourceLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {/* Follow-up due */}
        <div>
          <select
            defaultValue={searchParams.get("followUp")?.toString() || ""}
            onChange={(e) => updateParam("followUp", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Any Follow-Up Date</option>
            <option value="due">Follow-Up Due Today</option>
            <option value="overdue">Follow-Up Overdue</option>
          </select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <input
            type="date"
            defaultValue={searchParams.get("startDate")?.toString() || ""}
            onChange={(e) => updateParam("startDate", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            defaultValue={searchParams.get("endDate")?.toString() || ""}
            onChange={(e) => updateParam("endDate", e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
