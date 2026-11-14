import Link from "next/link";
import { Eye, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { leadSourceLabel, leadStatusLabel } from "@/lib/labels";

interface Lead {
  id: string;
  leadCode: string;
  name: string;
  mobile: string;
  source: string;
  campaignName: string;
  status: string;
  followUpStage: string;
  createdAt: Date;
}

export default function LeadTable({
  leads,
  totalPages,
  currentPage,
}: {
  leads: Lead[];
  totalPages: number;
  currentPage: number;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW_LEAD": return "bg-blue-100 text-blue-700";
      case "CONTACTED": return "bg-yellow-100 text-yellow-700";
      case "INTERESTED": return "bg-purple-100 text-purple-700";
      case "CONVERTED": return "bg-green-100 text-green-700";
      case "LOST": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm space-y-4 p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-green-700">
                    {lead.leadCode}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.mobile}</td>
                  <td className="px-4 py-3 text-gray-600">{leadSourceLabel(lead.source)}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.campaignName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(lead.status)}`}>
                      {leadStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/client/leads/${lead.id}`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/client/leads/${lead.id}/edit`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Edit Lead"
                      >
                        <Edit2 size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`?page=${page}`}
                className={`px-3 py-1 text-xs rounded-md border ${
                  currentPage === page ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
