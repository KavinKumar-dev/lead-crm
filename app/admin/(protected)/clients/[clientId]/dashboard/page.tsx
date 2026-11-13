import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { computeDashboardStats } from "@/lib/dashboardStats";
import DateFilterBar from "@/components/dashboard/DateFilterBar";
import DashboardView from "@/components/dashboard/DashboardView";
import SwitchClientBox from "./SwitchClientBox";
import { AlertTriangle, ArrowLeft, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminClientDashboard({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { range?: string; startDate?: string; endDate?: string };
}) {
  // Verify the admin session on the server before touching any client data.
  await requireAdmin();

  // The client is identified by its 5-digit Client ID.
  const client = await db.client.findUnique({
    where: { clientCode: params.clientId },
    select: { id: true, clientCode: true, clientName: true, businessName: true },
  });

  if (!client) notFound();

  const range = searchParams.range || "today";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;

  const result = await computeDashboardStats(client.id, {
    range: searchParams.range,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  });

  // The resolved range is carried into the lead-list links so the numbers on
  // the All Leads page match the tiles on the dashboard.
  const rangeQuery = result.success
    ? { startDate: result.stats.startDate, endDate: result.stats.endDate }
    : {};

  const leadsHref = (
    opts?: { status?: string; startDate?: string; endDate?: string }
  ) => {
    const p = new URLSearchParams();
    p.set("client", client.clientCode);
    if (opts?.status) p.set("status", opts.status);
    const start = opts?.startDate ?? rangeQuery.startDate;
    const end = opts?.endDate ?? rangeQuery.endDate;
    if (start) p.set("startDate", start);
    if (end) p.set("endDate", end);
    return `/admin/leads?${p.toString()}`;
  };

  const links = {
    leads: leadsHref,
    converted: leadsHref({ status: "CONVERTED" }),
    lost: leadsHref({ status: "LOST" }),
    followUps: `/admin/leads?client=${client.clientCode}&followUp=due`,
    overdueFollowUps: `/admin/leads?client=${client.clientCode}&followUp=overdue`,
  };

  return (
    <div className="space-y-6">
      {/* "Viewing as Admin" banner */}
      <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Eye size={20} />
          <div>
            <p className="font-bold">
              Viewing as Admin: {client.clientName} ({client.clientCode})
            </p>
            <p className="text-xs text-blue-100">{client.businessName}</p>
          </div>
        </div>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1 text-sm font-medium text-blue-50 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to all clients
        </Link>
      </div>

      <SwitchClientBox currentClientCode={client.clientCode} />

      <DateFilterBar currentRange={range} startDate={startDate} endDate={endDate} />

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{result.error}</span>
        </div>
      ) : (
        <DashboardView stats={result.stats} links={links} todayTitle="Today" />
      )}
    </div>
  );
}
