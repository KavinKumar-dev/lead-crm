import { getLeadDetails } from "../actions";
import { addFollowUp } from "../follow-up-actions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { LEAD_SOURCE, LEAD_STATUS, FOLLOW_UP_STAGE } from "@/lib/constants";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  const history = await db.followUp.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: 'desc' }
  });

  async function handleAddFollowUp(formData: FormData) {
    "use server";
    await addFollowUp(params.id, {
      stage: formData.get("stage") as any,
      status: formData.get("status") as any,
      note: formData.get("note") as string,
      customerResponse: formData.get("customerResponse") as string,
      nextFollowUpDate: formData.get("nextFollowUpDate") as string || null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-2xl font-bold">Lead: {lead.name} ({lead.leadCode})</h1>
        <p className="text-gray-500">Times contacted: {history.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form action={handleAddFollowUp} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-bold">Add Follow-Up</h2>
          <select name="stage" className="w-full border p-2 rounded">
            {Object.values(FOLLOW_UP_STAGE).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="status" className="w-full border p-2 rounded">
            {['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'NOT_RESPONDING', 'FOLLOW_UP_REQUIRED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input name="customerResponse" placeholder="Customer Response" className="w-full border p-2 rounded" />
          <textarea name="note" placeholder="Notes" className="w-full border p-2 rounded" />
          <input name="nextFollowUpDate" type="date" className="w-full border p-2 rounded" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save Follow-Up</button>
        </form>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-bold mb-4">Timeline</h2>
          <div className="space-y-4">
            {history.map(item => (
              <div key={item.id} className="border-l-2 border-green-500 pl-4 py-1">
                <p className="font-bold">{item.stage}</p>
                <p className="text-sm">{item.note}</p>
                <p className="text-xs text-gray-400">{format(item.createdAt, "PPpp")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
