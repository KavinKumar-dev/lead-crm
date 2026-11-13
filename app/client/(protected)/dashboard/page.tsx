import { getDashboardStats } from "./actions";
import DateFilterBar from "./DateFilterBar";
import {
  ArrowUpRight,
  UserPlus,
  PhoneCall,
  Heart,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  AlertTriangle,
  Timer,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: any;
  color: string;
  bg: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white p-4 rounded-xl border shadow-sm hover:shadow-md hover:border-green-300 transition-all flex items-start justify-between gap-2"
    >
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon size={18} />
        </span>
        <ArrowUpRight
          size={14}
          className="text-gray-300 group-hover:text-green-500 transition-colors"
        />
      </div>
    </Link>
  );
}

export default async function ClientDashboard({
  searchParams,
}: {
  searchParams: { range?: string; startDate?: string; endDate?: string };
}) {
  const result = await getDashboardStats({
    range: searchParams.range,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  });

  const range = searchParams.range || "today";
  const startDate = searchParams.startDate;
  const endDate = searchParams.endDate;

  // Build lead-list links that carry the current range through.
  const rangeQuery = (() => {
    const p = new URLSearchParams();
    if (range === "custom" && startDate && endDate) {
      p.set("startDate", startDate);
      p.set("endDate", endDate);
    }
    return p.toString();
  })();
  const leadsHref = (status?: string) => {
    const p = new URLSearchParams(rangeQuery);
    if (status) p.set("status", status);
    const q = p.toString();
    return q ? `/client/leads?${q}` : "/client/leads";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back — here is your lead performance.
        </p>
      </div>

      <DateFilterBar
        currentRange={range}
        startDate={startDate}
        endDate={endDate}
      />

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{result.error}</span>
        </div>
      ) : (
        <>
          {/* ===== Selected range KPIs ===== */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {result.stats.rangeLabel} — {result.stats.startDate} to{" "}
              {result.stats.endDate}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total Leads"
                value={result.stats.kpis.total}
                href={leadsHref()}
                icon={UserPlus}
                color="text-blue-600"
                bg="bg-blue-100"
              />
              <StatCard
                label="New Leads"
                value={result.stats.kpis.newLeads}
                href={leadsHref("NEW_LEAD")}
                icon={UserPlus}
                color="text-indigo-600"
                bg="bg-indigo-100"
              />
              <StatCard
                label="Contacted"
                value={result.stats.kpis.contacted}
                href={leadsHref("CONTACTED")}
                icon={PhoneCall}
                color="text-yellow-600"
                bg="bg-yellow-100"
              />
              <StatCard
                label="Interested"
                value={result.stats.kpis.interested}
                href={leadsHref("INTERESTED")}
                icon={Heart}
                color="text-purple-600"
                bg="bg-purple-100"
              />
              <StatCard
                label="Pending"
                value={result.stats.kpis.pending}
                href={leadsHref()}
                icon={Clock}
                color="text-orange-600"
                bg="bg-orange-100"
              />
              <StatCard
                label="Converted"
                value={result.stats.kpis.converted}
                href={leadsHref("CONVERTED")}
                icon={CheckCircle2}
                color="text-green-600"
                bg="bg-green-100"
              />
              <StatCard
                label="Lost"
                value={result.stats.kpis.lost}
                href={leadsHref("LOST")}
                icon={XCircle}
                color="text-red-600"
                bg="bg-red-100"
              />
              <StatCard
                label="Conversion Rate"
                value={`${result.stats.kpis.conversionRate}%`}
                href="/client/converted"
                icon={Percent}
                color="text-teal-600"
                bg="bg-teal-100"
              />
            </div>
          </div>

          {/* ===== Today section (always today, ignores the filter) ===== */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Today
              </h2>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <StatCard
                label="New Leads"
                value={result.stats.today.newLeads}
                href={`/client/leads?startDate=${result.stats.todayDate}&endDate=${result.stats.todayDate}`}
                icon={UserPlus}
                color="text-blue-600"
                bg="bg-blue-100"
              />
              <StatCard
                label="Follow-Ups"
                value={result.stats.today.followUps}
                href="/client/follow-ups"
                icon={Timer}
                color="text-amber-600"
                bg="bg-amber-100"
              />
              <StatCard
                label="Overdue"
                value={result.stats.today.overdue}
                href="/client/follow-ups"
                icon={AlertTriangle}
                color="text-orange-600"
                bg="bg-orange-100"
              />
              <StatCard
                label="Converted"
                value={result.stats.today.converted}
                href="/client/converted"
                icon={CheckCircle2}
                color="text-green-600"
                bg="bg-green-100"
              />
              <StatCard
                label="Awaiting Reply"
                value={result.stats.today.pendingResponses}
                href="/client/leads?status=NOT_RESPONDING"
                icon={MessageSquare}
                color="text-purple-600"
                bg="bg-purple-100"
              />
              <StatCard
                label="Lost"
                value={result.stats.today.lost}
                href="/client/lost"
                icon={XCircle}
                color="text-red-600"
                bg="bg-red-100"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
