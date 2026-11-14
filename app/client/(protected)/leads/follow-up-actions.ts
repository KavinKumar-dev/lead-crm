"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDateRange, parseIstDate } from "@/lib/dateRange";
import { leadStatusLabel, followUpStageLabel } from "@/lib/labels";

/**
 * Statuses a follow-up may set. NEW_LEAD is intentionally excluded: once a
 * lead has been contacted it must not fall back to "New Lead".
 */
const FOLLOW_UP_STATUSES = [
  "CONTACTED",
  "INTERESTED",
  "NOT_RESPONDING",
  "FOLLOW_UP_REQUIRED",
] as const;

const FollowUpSchema = z.object({
  stage: z.enum(["INITIAL_CONTACT", "FOLLOW_UP_1", "FOLLOW_UP_2", "FOLLOW_UP_3"]),
  status: z.enum(FOLLOW_UP_STATUSES),
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

  // A follow-up date in the past is not actionable — reject it with a field
  // error instead of throwing.
  if (validation.data.nextFollowUpDate) {
    const today = getDateRange("today").start;
    const chosen = parseIstDate(validation.data.nextFollowUpDate);
    if (!chosen) {
      return {
        success: false,
        errors: { nextFollowUpDate: ["Invalid date. Please use a valid date."] },
      };
    }
    if (chosen.getTime() < today.getTime()) {
      return {
        success: false,
        errors: {
          nextFollowUpDate: ["Next Follow-Up Date cannot be before today."],
        },
      };
    }
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
          details: `Stage updated to ${followUpStageLabel(validation.data.stage)} (${leadStatusLabel(validation.data.status)}) for ${lead.name}`,
        }
      });

      revalidatePath(`/client/leads/${leadId}`);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, errors: { form: e.message } };
  }
}

/**
 * Leads with a follow-up date that still needs attention.
 *
 * - "due"     → follow-ups scheduled for today (IST)
 * - "overdue" → follow-ups scheduled before today
 * - default   → due today or overdue
 *
 * The client scope comes only from the session.
 */
export async function getDueFollowUps(filter?: "due" | "overdue") {
  const session = await requireClient();
  const today = getDateRange("today");

  const nextFollowUpDate =
    filter === "due"
      ? { gte: today.start, lte: today.end }
      : filter === "overdue"
        ? { lt: today.start }
        : { lte: today.end };

  return await db.lead.findMany({
    where: {
      clientId: session.id,
      nextFollowUpDate,
      status: { notIn: ['CONVERTED', 'LOST'] }
    },
    orderBy: { nextFollowUpDate: 'asc' }
  });
}
