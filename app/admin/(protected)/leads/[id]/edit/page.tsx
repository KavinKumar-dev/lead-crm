import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminLeadDetails, updateLeadAsAdmin } from "../../actions";
import LeadEditForm from "@/components/leads/LeadEditForm";
import { ArrowLeft, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEditLeadPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getAdminLeadDetails(params.id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/leads/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to lead
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Edit Lead: <span className="font-mono text-blue-600">{lead.leadCode}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <Building2 size={14} />
          Client:{" "}
          <Link
            href={`/admin/clients/${lead.client.clientCode}/dashboard`}
            className="font-semibold text-blue-600 hover:underline"
          >
            {lead.client.clientName} ({lead.client.clientCode})
          </Link>
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2">
        You are editing this lead as an administrator. The change is recorded in
        the activity log.
      </div>

      <LeadEditForm
        lead={lead}
        action={updateLeadAsAdmin.bind(null, params.id)}
        redirectTo={`/admin/leads/${params.id}`}
        submitLabel="Save Changes (Admin)"
        theme="admin"
      />
    </div>
  );
}
