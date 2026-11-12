import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { format } from "date-fns";

export default async function LostPage() {
  const session = await requireClient();
  const lostLeads = await db.lead.findMany({
    where: { clientId: session.id, status: 'LOST' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lost Leads</h1>
      <table className="w-full bg-white border">
        <tr className="bg-gray-50 border-b">
            <th className="p-3">Customer</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Date</th>
        </tr>
        {lostLeads.map(l => (
            <tr key={l.id} className="border-b">
                <td className="p-3">{l.name}</td>
                <td className="p-3">{l.lostReason}</td>
                <td className="p-3">{l.updatedAt ? format(l.updatedAt, "PP") : "N/A"}</td>
            </tr>
        ))}
      </table>
    </div>
  );
}
