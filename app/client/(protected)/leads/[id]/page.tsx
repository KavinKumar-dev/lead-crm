import { getLeadDetails } from "../actions";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import LeadDetailsClient from "./LeadDetailsClient";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const session = await requireClient();
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  // Scoped to the session's client as well — the history must never expose
  // follow-up records of another client's lead.
  const history = await db.followUp.findMany({
    where: { leadId: lead.id, clientId: session.id },
    orderBy: { createdAt: 'desc' }
  });

  return <LeadDetailsClient lead={lead} history={history} />;
}
