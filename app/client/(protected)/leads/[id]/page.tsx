import { getLeadDetails } from "../actions";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import LeadDetailsClient from "./LeadDetailsClient";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const lead = await getLeadDetails(params.id);
  if (!lead) notFound();

  const history = await db.followUp.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: 'desc' }
  });

  return <LeadDetailsClient lead={lead} history={history} />;
}
