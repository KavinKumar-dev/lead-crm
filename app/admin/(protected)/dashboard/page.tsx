import { getAdminDashboard } from "./actions";
import ClientOverviewTable from "./ClientOverviewTable";
import ConvertedPerClientChart from "./ConvertedPerClientChart";
import DateFilterBar from "@/components/dashboard/DateFilterBar";
import DashboardView from "@/components/dashboard/DashboardView";
import { AlertTriangle, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { range?: string; startDate?: string; endDate?: string };
}) {
  const range = searchParams.range || "today";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;

  const result = await getAdminDashboard({
    range: searchParams.range,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  });

  // The resolved range is carried into the lead-list links so the numbers on
  // the All Leads page match the tiles on the dashboard.
  const rangeQuery =
    result.success
      ? { startDate: result.data.stats.startDate, endDate: result.data.stats.endDate }
      : {};

  const leadsHref = (
    opts?: { status?: string; startDate?: string; endDate?: string }
  ) => {
    const p = new URLSearchParams();
    if (opts?.status) p.set("status", opts.status);
    const start = opts?.startDate ?? rangeQuery.startDate;
    const end = opts?.endDate ?? rangeQuery.endDate;
    if (start) p.set("startDate", start);
    if (end) p.set("endDate", end);
    const q = p.toString();
    return q ? `/admin/leads?${q}` : "/admin/leads";
  };

  const links = {
    leads: leadsHref,
    converted: leadsHref({ status: "CONVERTED" }),
    lost: leadsHref({ status: "LOST" }),
    followUps: "/admin/leads?followUp=due",
    overdueFollowUps: "/admin/leads?followUp=overdue",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">
            Centralized monitoring of every client account.
          </p>
        </div>
        {result.success && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border rounded-lg px-3 py-2">
            <Users size={16} className="text-blue-600" />
            <span>
              <span className="font-bold text-gray-900">
                {result.data.clients.length}
              </span>{" "}
              client{result.data.clients.length === 1 ? "" : "s"} monitored
            </span>
          </div>
        )}
      </div>

      <DateFilterBar currentRange={range} startDate={startDate} endDate={endDate} />

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{result.error}</span>
        </div>
      ) : (
        <>
          <DashboardView
            stats={result.data.stats}
            links={links}
            variant="admin"
            todayTitle="Today across all clients"
          />

          {/* ===== Client overview table ===== */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Client overview
            </h2>
            <ClientOverviewTable clients={result.data.clients} />
            <p className="text-xs text-gray-500 mt-2">
              Rows highlighted in orange have overdue follow-ups. Lead counts
              respect the selected period; overdue follow-ups are live.
            </p>
          </div>

          {/* ===== Client comparison chart ===== */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Client comparison
            </h2>
            <ConvertedPerClientChart data={result.data.chart} />
          </div>
        </>
      )}
    </div>
  );
}
