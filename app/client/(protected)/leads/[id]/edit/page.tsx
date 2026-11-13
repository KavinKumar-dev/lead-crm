import { getLeadDetails, updateLead } from "../../actions";
import { notFound } from "next/navigation";
import LeadEditForm from "@/components/leads/LeadEditForm";

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Lead: {lead.leadCode}</h1>
      <LeadEditForm
        lead={lead}
        action={updateLead.bind(null, params.id)}
        redirectTo={`/client/leads/${params.id}`}
        submitLabel="Save Changes"
        theme="client"
      />
    </div>
  );
}
