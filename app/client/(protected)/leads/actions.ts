"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const LeadSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  source: z.string(),
  campaignName: z.string().min(1),
  nextFollowUpDate: z.string().optional().nullable(),
  remarks: z.string().optional(),
});

async function generateLeadCode() {
  const count = await db.lead.count();
  return `LD-${(count + 1).toString().padStart(5, '0')}`;
}

export async function checkDuplicateLead(mobile: string) {
  const session = await requireClient();
  const existing = await db.lead.findFirst({
    where: {
      clientId: session.id,
      mobile: mobile,
    }
  });
  return !!existing;
}

export async function createLead(data: z.infer<typeof LeadSchema>) {
  const session = await requireClient();
  const validation = LeadSchema.safeParse(data);
  if (!validation.success) throw new Error(validation.error.errors[0].message);

  const { name, mobile, source, campaignName, nextFollowUpDate, remarks } = validation.data;
  const leadCode = await generateLeadCode();

  const lead = await db.lead.create({
    data: {
      leadCode,
      clientId: session.id,
      name,
      mobile,
      source,
      campaignName,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      remarks,
    }
  });

  await db.activityLog.create({
    data: {
      clientId: session.id,
      leadId: lead.id,
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      details: `Created lead ${name} (${leadCode})`,
    }
  });

  revalidatePath("/client/leads");
  return { success: true, leadId: lead.id };
}

export async function getLeads(params: {
  q?: string;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}) {
  const session = await requireClient();
  const take = 20;
  const skip = ((params.page || 1) - 1) * take;

  const where: any = {
    clientId: session.id,
  };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { mobile: { contains: params.q } },
      { leadCode: { contains: params.q } },
    ];
  }

  if (params.status) where.status = params.status;
  if (params.source) where.source = params.source;
  
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = new Date(params.startDate);
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    db.lead.count({ where }),
  ]);

  return {
    leads,
    totalPages: Math.ceil(total / take),
    totalCount: total,
  };
}

export async function getLeadDetails(id: string) {
  const session = await requireClient();
  const lead = await db.lead.findFirst({
    where: { id, clientId: session.id },
  });
  if (!lead) return null;
  return lead;
}

export async function updateLead(id: string, data: z.infer<typeof LeadSchema>) {
  const session = await requireClient();
  const validation = LeadSchema.safeParse(data);
  if (!validation.success) throw new Error(validation.error.errors[0].message);

  const existing = await db.lead.findFirst({ where: { id, clientId: session.id } });
  if (!existing) throw new Error("Lead not found");

  const lead = await db.lead.update({
    where: { id },
    data: {
      ...validation.data,
      nextFollowUpDate: validation.data.nextFollowUpDate ? new Date(validation.data.nextFollowUpDate) : null,
    }
  });

  await db.activityLog.create({
    data: {
      clientId: session.id,
      leadId: lead.id,
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: lead.id,
      details: `Updated lead ${lead.name}`,
    }
  });

  revalidatePath("/client/leads");
  revalidatePath(`/client/leads/${id}`);
  return { success: true };
}

export async function importLeads(rows: any[]) {
  const session = await requireClient();
  const results = {
    successCount: 0,
    errors: [] as { row: number; error: string }[],
  };

  if (rows.length > 500) throw new Error("Maximum 500 rows allowed");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validation = LeadSchema.safeParse({
      name: row.name,
      mobile: String(row.mobile || ""),
      source: row.source || "OTHER",
      campaignName: row.campaignName || "Bulk Import",
    });

    if (!validation.success) {
      results.errors.push({ row: i + 1, error: validation.error.errors[0].message });
      continue;
    }

    try {
      const leadCode = await generateLeadCode();
      await db.lead.create({
        data: {
          ...validation.data,
          leadCode,
          clientId: session.id,
        }
      });
      results.successCount++;
    } catch (e: any) {
      results.errors.push({ row: i + 1, error: e.message });
    }
  }

  if (results.successCount > 0) {
    await db.activityLog.create({
      data: {
        clientId: session.id,
        action: "LEADS_IMPORTED",
        details: `Imported ${results.successCount} leads`,
      }
    });
    revalidatePath("/client/leads");
  }

  return results;
}
