import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { format } from "date-fns";

export default async function LostPage() {
  const session = await requireClient();
  const lostLeads = await db.lead.findMany({
    where: { clientId: session.id, status: 'LOST' },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lost Leads</h1>
        <p className="text-gray-500">{lostLeads.length} lead(s) marked as lost</p>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
                <th className="p-3">Customer</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lostLeads.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No lost leads yet.
                  </td>
                </tr>
              ) : (
                lostLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{l.name}</td>
                    <td className="p-3 text-gray-600">{l.lostReason || "—"}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {l.updatedAt ? format(l.updatedAt, "PP") : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
