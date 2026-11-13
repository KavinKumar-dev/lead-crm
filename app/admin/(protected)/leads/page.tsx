import { getAdminLeads } from "./actions";
import AdminLeadFilters from "./AdminLeadFilters";
import AdminLeadTable from "./AdminLeadTable";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    client?: string;
    status?: string;
    stage?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    followUp?: string;
    page?: string;
  };
}) {
  const page = parseInt(searchParams.page || "1", 10) || 1;

  const data = await getAdminLeads({
    q: searchParams.q,
    client: searchParams.client,
    status: searchParams.status,
    stage: searchParams.stage,
    source: searchParams.source,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    followUp: searchParams.followUp,
    page,
  });

  // Preserve the active filters when paginating.
  const queryString = new URLSearchParams(
    Object.entries({
      q: searchParams.q,
      client: searchParams.client,
      status: searchParams.status,
      stage: searchParams.stage,
      source: searchParams.source,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      followUp: searchParams.followUp,
    }).filter(([, v]) => !!v) as [string, string][]
  ).toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
        <p className="text-gray-500">
          Every lead across all clients ({data.totalCount} total)
        </p>
      </div>

      <Suspense fallback={<div className="h-32 bg-white border rounded-xl animate-pulse" />}>
        <AdminLeadFilters clients={data.clients} />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-white border rounded-xl animate-pulse" />}>
        <AdminLeadTable
          leads={data.leads}
          totalPages={data.totalPages}
          currentPage={data.currentPage}
          totalCount={data.totalCount}
          queryString={queryString}
        />
      </Suspense>
    </div>
  );
}
