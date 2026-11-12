import { getLeadDetails, updateLead } from "../../actions";
import { notFound } from "next/navigation";
import { LEAD_SOURCE, LEAD_STATUS } from "@/lib/constants";

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  async function handleSubmit(formData: FormData) {
    "use server";
    await updateLead(params.id, {
      name: formData.get("name") as string,
      mobile: formData.get("mobile") as string,
      source: formData.get("source") as string,
      campaignName: formData.get("campaignName") as string,
      nextFollowUpDate: formData.get("nextFollowUpDate") as string || null,
      remarks: formData.get("remarks") as string,
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Lead: {lead.leadCode}</h1>
      <form action={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="name" defaultValue={lead.name} className="border p-2 rounded" required />
          <input name="mobile" defaultValue={lead.mobile} className="border p-2 rounded" required pattern="\\d{10}" />
        </div>
        <select name="source" defaultValue={lead.source} className="w-full border p-2 rounded">
          {Object.values(LEAD_SOURCE).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input name="campaignName" defaultValue={lead.campaignName} className="w-full border p-2 rounded" required />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save Changes</button>
      </form>
    </div>
  );
}
