import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminLeadDetails } from "../actions";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Building2, Phone, Calendar, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLeadPage({ params }: { params: { id: string } }) {
  const lead = await getAdminLeadDetails(params.id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={14} /> Back to all leads
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Lead: {lead.name}{" "}
            <span className="font-mono text-blue-600 text-xl">{lead.leadCode}</span>
          </h1>
        </div>
        <Link
          href={`/admin/leads/${lead.id}/edit`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors self-start"
        >
          <Edit2 size={16} />
          Edit Lead
        </Link>
      </div>

      {/* Client banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-blue-900">
          <Building2 size={16} />
          Client:{" "}
          <Link
            href={`/admin/clients/${lead.client.clientCode}/dashboard`}
            className="font-bold underline"
          >
            {lead.client.clientName} ({lead.client.clientCode})
          </Link>
        </span>
        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded-full">
          {lead.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead information */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-bold mb-4">Lead Information</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500 flex items-center gap-2">
                <Phone size={14} /> Mobile
              </dt>
              <dd className="font-medium">{lead.mobile}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500 flex items-center gap-2">
                <Tag size={14} /> Source
              </dt>
              <dd className="font-medium">{lead.source}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500">Campaign</dt>
              <dd className="font-medium">{lead.campaignName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500 flex items-center gap-2">
                <Calendar size={14} /> Next Follow-Up
              </dt>
              <dd className="font-medium">
                {lead.nextFollowUpDate ? format(lead.nextFollowUpDate, "PPP") : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500">Follow-Up Stage</dt>
              <dd className="font-medium">{lead.followUpStage.replace(/_/g, " ")}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium">{format(lead.createdAt, "PPP")}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b pb-2">
              <dt className="text-gray-500">Last Updated</dt>
              <dd className="font-medium">{format(lead.updatedAt, "PPP")}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500">Remarks</dt>
              <dd className="font-medium text-right">{lead.remarks || "—"}</dd>
            </div>
          </dl>

          {lead.conversion && (
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-bold text-green-800 mb-1">Converted</p>
              <p className="text-green-700">
                {lead.conversion.customerName} · {lead.conversion.productService} ·{" "}
                {lead.conversion.orderValue != null
                  ? `₹${lead.conversion.orderValue}`
                  : "No order value"}{" "}
                · {format(lead.conversion.conversionDate, "PPP")}
              </p>
            </div>
          )}
        </div>

        {/* Timeline + activity log */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="font-bold mb-4">Follow-Up Timeline ({lead.followUps.length})</h2>
            {lead.followUps.length === 0 ? (
              <p className="text-sm text-gray-500">No follow-ups recorded yet.</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {lead.followUps.map((item) => (
                  <div key={item.id} className="border-l-2 border-blue-500 pl-4 py-1">
                    <p className="font-bold text-sm">
                      {item.stage.replace(/_/g, " ")} — {item.status.replace(/_/g, " ")}
                    </p>
                    {item.customerResponse && (
                      <p className="text-sm italic">"{item.customerResponse}"</p>
                    )}
                    {item.note && <p className="text-sm">{item.note}</p>}
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(item.createdAt), "PPpp")} · by{" "}
                      {item.updatedByRole}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="font-bold mb-4">Activity Log ({lead.activityLogs.length})</h2>
            {lead.activityLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {lead.activityLogs.map((log) => (
                  <div key={log.id} className="text-sm">
                    <p className="font-semibold text-gray-800">{log.action}</p>
                    {log.details && <p className="text-gray-600">{log.details}</p>}
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(log.createdAt), "PPpp")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
