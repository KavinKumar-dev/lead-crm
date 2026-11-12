import { getLeadDetails } from "../actions";
import { notFound } from "next/navigation";
import { format } from "date-fns";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  return (
    <div className="max-w-2xl bg-white p-6 rounded-xl border shadow-sm space-y-6">
      <h1 className="text-2xl font-bold">Lead Details: {lead.leadCode}</h1>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-gray-500">Name</p><p className="font-medium">{lead.name}</p></div>
        <div><p className="text-gray-500">Mobile</p><p className="font-medium">{lead.mobile}</p></div>
        <div><p className="text-gray-500">Source</p><p className="font-medium">{lead.source}</p></div>
        <div><p className="text-gray-500">Campaign</p><p className="font-medium">{lead.campaignName}</p></div>
        <div><p className="text-gray-500">Status</p><p className="font-medium">{lead.status}</p></div>
        <div><p className="text-gray-500">Created</p><p className="font-medium">{format(new Date(lead.createdAt), "PPP")}</p></div>
      </div>
      <div><p className="text-gray-500">Remarks</p><p className="text-sm bg-gray-50 p-3 rounded">{lead.remarks || "No remarks"}</p></div>
    </div>
  );
}
