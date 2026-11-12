import { getDueFollowUps } from "../leads/follow-up-actions";
import Link from "next/link";
import { format } from "date-fns";

export default async function FollowUpsPage() {
  const leads = await getDueFollowUps();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Follow-Ups Due</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4">Lead ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b">
                <td className="p-4 font-mono">{lead.leadCode}</td>
                <td className="p-4">{lead.name}</td>
                <td className="p-4">{lead.nextFollowUpDate ? format(lead.nextFollowUpDate, "PPP") : "N/A"}</td>
                <td className="p-4"><Link href={`/client/leads/${lead.id}`} className="text-green-600 underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
