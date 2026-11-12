import { getLeads } from "./actions";
import LeadFilters from "./LeadFilters";
import ExcelImportModal from "./ExcelImportModal";
import LeadTable from "./LeadTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  };
}) {
  const page = parseInt(searchParams.page || "1", 10);
  const data = await getLeads({
    q: searchParams.q,
    status: searchParams.status,
    source: searchParams.source,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
          <p className="text-gray-500">Manage and view your lead pipeline ({data.totalCount} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelImportModal />
          <Link
            href="/client/leads/new"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            <span>Add Lead</span>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="h-16 bg-white border rounded-xl animate-pulse" />}>
        <LeadFilters />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-white border rounded-xl animate-pulse" />}>
        <LeadTable leads={data.leads} totalPages={data.totalPages} currentPage={page} />
      </Suspense>
    </div>
  );
}
