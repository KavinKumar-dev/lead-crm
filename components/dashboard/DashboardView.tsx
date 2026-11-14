import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Percent,
  PhoneCall,
  Timer,
  UserPlus,
  XCircle,
} from "lucide-react";
import { DashboardStats } from "@/lib/dashboardStats";
import StatCard from "./StatCard";

/**
 * Links used by the dashboard tiles. The client dashboard points at the
 * client's own pages, while the admin dashboards point at /admin/leads with
 * the appropriate filters applied.
 */
export interface DashboardLinks {
  leads: (opts?: { status?: string; startDate?: string; endDate?: string }) => string;
  converted: string;
  lost: string;
  followUps: string;
  /** Overdue follow-ups list (defaults to followUps when not provided). */
  overdueFollowUps?: string;
}

export interface DashboardViewProps {
  stats: DashboardStats;
  links: DashboardLinks;
  /** Admin overall view hides the "New Leads" tile (not part of the spec). */
  variant?: "client" | "admin";
  todayTitle?: string;
}

export default function DashboardView({
  stats,
  links,
  variant = "client",
  todayTitle = "Today",
}: DashboardViewProps) {
  const { kpis, today } = stats;

  return (
    <>
      {/* ===== Selected range KPIs ===== */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {stats.rangeLabel} — {stats.startDate} to {stats.endDate}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Leads"
            value={kpis.total}
            href={links.leads()}
            icon={UserPlus}
            color="text-blue-600"
            bg="bg-blue-100"
          />
          {variant === "client" && (
            <StatCard
              label="New Leads"
              value={kpis.newLeads}
              href={links.leads({ status: "NEW_LEAD" })}
              icon={UserPlus}
              color="text-indigo-600"
              bg="bg-indigo-100"
            />
          )}
          <StatCard
            label="Contacted"
            value={kpis.contacted}
            href={links.leads({ status: "CONTACTED" })}
            icon={PhoneCall}
            color="text-yellow-600"
            bg="bg-yellow-100"
          />
          <StatCard
            label="Interested"
            value={kpis.interested}
            href={links.leads({ status: "INTERESTED" })}
            icon={Heart}
            color="text-purple-600"
            bg="bg-purple-100"
          />
          <StatCard
            label="Pending"
            value={kpis.pending}
            href={links.leads()}
            icon={Clock}
            color="text-orange-600"
            bg="bg-orange-100"
          />
          <StatCard
            label="Converted"
            value={kpis.converted}
            href={links.leads({ status: "CONVERTED" })}
            icon={CheckCircle2}
            color="text-green-600"
            bg="bg-green-100"
          />          <StatCard
            label="Lost"
            value={kpis.lost}
            href={links.leads({ status: "LOST" })}
            icon={XCircle}
            color="text-red-600"
            bg="bg-red-100"
          />
          <StatCard
            label={variant === "admin" ? "Overall Conversion Rate" : "Conversion Rate"}
            value={`${kpis.conversionRate}%`}
            href={links.converted}
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
            {todayTitle}
          </h2>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            label="New Leads"
            value={today.newLeads}
            href={links.leads({ startDate: stats.todayDate, endDate: stats.todayDate })}
            icon={UserPlus}
            color="text-blue-600"
            bg="bg-blue-100"
          />
          <StatCard
            label="Follow-Ups"
            value={today.followUps}
            href={links.followUps}
            icon={Timer}
            color="text-amber-600"
            bg="bg-amber-100"
          />
          <StatCard
            label="Overdue"
            value={today.overdue}
            href={links.overdueFollowUps ?? links.followUps}
            icon={AlertTriangle}
            color="text-orange-600"
            bg="bg-orange-100"
          />
          <StatCard
            label="Converted"
            value={today.converted}
            href={links.converted}
            icon={CheckCircle2}
            color="text-green-600"
            bg="bg-green-100"
          />
          <StatCard
            label="Awaiting Reply"
            value={today.pendingResponses}
            href={links.leads({ status: "NOT_RESPONDING" })}
            icon={MessageSquare}
            color="text-purple-600"
            bg="bg-purple-100"
          />
          <StatCard
            label="Lost"
            value={today.lost}
            href={links.lost}
            icon={XCircle}
            color="text-red-600"
            bg="bg-red-100"
          />
        </div>
      </div>
    </>
  );
}
