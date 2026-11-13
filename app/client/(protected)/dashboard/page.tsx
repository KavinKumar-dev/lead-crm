import { getDashboardStats } from "./actions";
import DateFilterBar from "@/components/dashboard/DateFilterBar";
import DashboardView from "@/components/dashboard/DashboardView";
import { AlertTriangle } from "lucide-react";

export default async function ClientDashboard({
  searchParams,
}: {
  searchParams: { range?: string; startDate?: string; endDate?: string };
}) {
  const range = searchParams.range || "today";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;

  const result = await getDashboardStats({
    range: searchParams.range,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  });

  // Build lead-list links that carry the current range through.
  const rangeQuery = (() => {
    const p = new URLSearchParams();
    if (range === "custom" && startDate && endDate) {
      p.set("startDate", startDate);
      p.set("endDate", endDate);
    }
    return p.toString();
  })();

  const links = {
    leads: (opts?: { status?: string; startDate?: string; endDate?: string }) => {
      const p = new URLSearchParams(rangeQuery);
      if (opts?.status) p.set("status", opts.status);
      if (opts?.startDate) p.set("startDate", opts.startDate);
      if (opts?.endDate) p.set("endDate", opts.endDate);
      const q = p.toString();
      return q ? `/client/leads?${q}` : "/client/leads";
    },
    converted: "/client/converted",
    lost: "/client/lost",
    followUps: "/client/follow-ups",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back — here is your lead performance.
        </p>
      </div>

      <DateFilterBar currentRange={range} startDate={startDate} endDate={endDate} />

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{result.error}</span>
        </div>
      ) : (
        <DashboardView stats={result.stats} links={links} />
      )}
    </div>
  );
}
