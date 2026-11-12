"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const FollowUpSchema = z.object({
  stage: z.enum(['INITIAL_CONTACT', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_3']),
  status: z.enum(['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'NOT_RESPONDING', 'FOLLOW_UP_REQUIRED']),
  note: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  customerResponse: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  nextFollowUpDate: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional().nullable()),
});

export async function addFollowUp(leadId: string, data: any) {
  const session = await requireClient();
  const validation = FollowUpSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error.flatten());
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    return await db.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id: leadId, clientId: session.id } });
      if (!lead) throw new Error("Lead not found");

      const followUp = await tx.followUp.create({
        data: {
          leadId,
          clientId: session.id,
          stage: validation.data.stage,
          status: validation.data.status,
          note: validation.data.note,
          customerResponse: validation.data.customerResponse,
          nextFollowUpDate: validation.data.nextFollowUpDate ? new Date(validation.data.nextFollowUpDate) : null,
          updatedByRole: "CLIENT",
          updatedById: session.id
        }
      });

      await tx.lead.update({
        where: { id: leadId },
        data: {
          followUpStage: validation.data.stage,
          status: validation.data.status,
          nextFollowUpDate: validation.data.nextFollowUpDate ? new Date(validation.data.nextFollowUpDate) : null,
          updatedAt: new Date()
        }
      });

      await tx.activityLog.create({
        data: {
          clientId: session.id,
          leadId,
          action: "FOLLOW_UP_ADDED",
          entityType: "FollowUp",
          entityId: followUp.id,
          details: `Stage updated to ${validation.data.stage} for ${lead.name}`,
        }
      });

      revalidatePath(`/client/leads/${leadId}`);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, errors: { form: e.message } };
  }
}

export async function getDueFollowUps() {
  const session = await requireClient();
  return await db.lead.findMany({
    where: {
      clientId: session.id,
      nextFollowUpDate: { lte: new Date() },
      status: { notIn: ['CONVERTED', 'LOST'] }
    },
    orderBy: { nextFollowUpDate: 'asc' }
  });
}
