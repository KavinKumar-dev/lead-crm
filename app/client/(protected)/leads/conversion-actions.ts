"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ConversionSchema = z.object({
  customerName: z.string().min(2),
  contactNumber: z.string().min(10),
  conversionDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  productService: z.string().min(2),
  orderValue: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
  remarks: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
});

const LostSchema = z.object({
  lostReason: z.string().min(2),
  note: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
});

export async function markAsConverted(leadId: string, data: any) {
  const session = await requireClient();
  const validation = ConversionSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error.flatten());
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    return await db.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id: leadId, clientId: session.id } });
      if (!lead || lead.status === 'CONVERTED' || lead.status === 'LOST') throw new Error("Invalid lead");

      const conversion = await tx.conversion.create({
        data: {
          leadId,
          clientId: session.id,
          ...validation.data,
          conversionDate: new Date(validation.data.conversionDate),
        }
      });

      await tx.lead.update({ where: { id: leadId }, data: { status: 'CONVERTED' } });

      await tx.followUp.create({
        data: {
          leadId,
          clientId: session.id,
          stage: 'INITIAL_CONTACT',
          status: 'CONVERTED',
          note: `Lead Converted: ${validation.data.productService} (Value: ${validation.data.orderValue || 0})`,
          updatedByRole: 'CLIENT',
          updatedById: session.id
        }
      });

      await tx.activityLog.create({
        data: {
          clientId: session.id,
          leadId,
          action: "LEAD_CONVERTED",
          entityType: "Conversion",
          entityId: conversion.id,
          details: `Converted lead ${lead.leadCode}`
        }
      });

      revalidatePath(`/client/leads/${leadId}`);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, errors: { form: e.message } };
  }
}

export async function markAsLost(leadId: string, data: any) {
  const session = await requireClient();
  const validation = LostSchema.safeParse(data);
  if (!validation.success) {
    console.error(validation.error.flatten());
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    return await db.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id: leadId, clientId: session.id } });
      if (!lead || lead.status === 'CONVERTED' || lead.status === 'LOST') throw new Error("Invalid lead");

      await tx.lead.update({
        where: { id: leadId },
        data: { status: 'LOST', lostReason: validation.data.lostReason }
      });

      await tx.followUp.create({
        data: {
          leadId,
          clientId: session.id,
          stage: 'INITIAL_CONTACT',
          status: 'LOST',
          note: `Lead Lost: ${validation.data.lostReason} - ${validation.data.note || ''}`,
          updatedByRole: 'CLIENT',
          updatedById: session.id
        }
      });

      await tx.activityLog.create({
        data: {
          clientId: session.id,
          leadId,
          action: "LEAD_LOST",
          entityType: "Lead",
          entityId: leadId,
          details: `Lost lead ${lead.leadCode}: ${validation.data.lostReason}`
        }
      });

      revalidatePath(`/client/leads/${leadId}`);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, errors: { form: e.message } };
  }
}
