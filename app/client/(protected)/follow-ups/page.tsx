import { getDueFollowUps } from "../leads/follow-up-actions";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const FILTERS = {
  all: { label: "All due", filter: undefined },
  due: { label: "Due today", filter: "due" as const },
  overdue: { label: "Overdue", filter: "overdue" as const },
};

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const current =
    searchParams.filter === "due" || searchParams.filter === "overdue"
      ? searchParams.filter
      : "all";

  const leads = await getDueFollowUps(FILTERS[current].filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Follow-Ups Due</h1>
          <p className="text-gray-500">{leads.length} follow-up(s) need attention</p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
          {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((key) => (
            <Link
              key={key}
              href={
                key === "all"
                  ? "/client/follow-ups"
                  : `/client/follow-ups?filter=${key}`
              }
              className={`inline-flex items-center justify-center px-3 py-2 min-h-[40px] rounded-md text-sm font-medium transition-colors ${
                current === key
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {FILTERS[key].label}
            </Link>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
          No follow-ups in this list.
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
                  <th className="p-4 text-left">Lead ID</th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Due Date</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono whitespace-nowrap">{lead.leadCode}</td>
                    <td className="p-4">{lead.name}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">
                      {lead.nextFollowUpDate ? format(lead.nextFollowUpDate, "PPP") : "N/A"}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/client/leads/${lead.id}`}
                        className="inline-flex items-center text-green-600 underline min-h-[40px]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
