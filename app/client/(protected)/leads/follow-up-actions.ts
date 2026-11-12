"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const FollowUpSchema = z.object({
  stage: z.enum(['INITIAL_CONTACT', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3']),
  status: z.enum(['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'NOT_RESPONDING', 'FOLLOW_UP_REQUIRED']),
  note: z.string().optional(),
  customerResponse: z.string().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
});

export async function addFollowUp(leadId: string, data: z.infer<typeof FollowUpSchema>) {
  const session = await requireClient();
  const validation = FollowUpSchema.safeParse(data);
  if (!validation.success) throw new Error(validation.error.errors[0].message);

  return await db.$transaction(async (tx) => {
    // 1. Verify lead belongs to client
    const lead = await tx.lead.findFirst({
      where: { id: leadId, clientId: session.id }
    });
    if (!lead) throw new Error("Lead not found");

    // 2. Create history
    const followUp = await tx.followUp.create({
      data: {
        leadId,
        clientId: session.id,
        stage: data.stage,
        status: data.status,
        note: data.note,
        customerResponse: data.customerResponse,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        updatedByRole: "CLIENT",
        updatedById: session.id
      }
    });

    // 3. Update Lead
    await tx.lead.update({
      where: { id: leadId },
      data: {
        followUpStage: data.stage,
        status: data.status,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        updatedAt: new Date()
      }
    });

    // 4. Log
    await tx.activityLog.create({
      data: {
        clientId: session.id,
        leadId,
        action: "FOLLOW_UP_ADDED",
        entityType: "FollowUp",
        entityId: followUp.id,
        details: `Stage updated to ${data.stage} for ${lead.name}`,
      }
    });

    revalidatePath(`/client/leads/${leadId}`);
    return { success: true };
  });
}

export async function getDueFollowUps() {
  const session = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await db.lead.findMany({
    where: {
      clientId: session.id,
      nextFollowUpDate: { lte: new Date() },
      status: { notIn: ['CONVERTED', 'LOST'] }
    },
    orderBy: { nextFollowUpDate: 'asc' }
  });
}
