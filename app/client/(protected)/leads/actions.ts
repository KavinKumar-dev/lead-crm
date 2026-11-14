"use server";

import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fieldErrors, logValidationError } from "@/lib/validation";
import { statusFilter } from "@/lib/leadFilters";
import { generateLeadCode, isUniqueViolation } from "@/lib/leadCodes";
import { getClientIdentity, notifyNewLeads } from "@/lib/notifications";

const LeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  source: z.string(),
  campaignName: z.string().min(1, "Campaign name is required"),
  nextFollowUpDate: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable()
  ),
  remarks: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable()
  ),
});

/** How many times a lead code collision is retried before giving up. */
const LEAD_CODE_ATTEMPTS = 3;

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

  // The lead code sequence is scoped to this client (see lib/leadCodes.ts).
  const client = await getClientIdentity(db, session.id);
  if (!client) throw new Error("Client account not found");

  let lastError: unknown = null;

  for (let attempt = 0; attempt < LEAD_CODE_ATTEMPTS; attempt++) {
    const leadCode = await generateLeadCode(session.id, client.clientCode);

    try {
      const leadId = await db.$transaction(async (tx) => {
        const lead = await tx.lead.create({
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

        await tx.activityLog.create({
          data: {
            clientId: session.id,
            leadId: lead.id,
            action: "LEAD_CREATED",
            entityType: "Lead",
            entityId: lead.id,
            details: `Created lead ${name} (${leadCode})`,
          }
        });

        // Notification for the client (clientId set) and for the admin
        // (clientId null).
        await notifyNewLeads(tx, {
          clientId: client.id,
          clientCode: client.clientCode,
          clientName: client.clientName,
          leads: [{ id: lead.id, leadCode: lead.leadCode, name: lead.name, source: lead.source }],
        });

        return lead.id;
      });

      revalidatePath("/client/leads");
      return { success: true, leadId };
    } catch (error) {
      // Two leads created at the same moment can pick the same sequence
      // number — retry with a fresh code.
      lastError = error;
      if (!isUniqueViolation(error)) throw error;
    }
  }

  console.error("createLead error:", lastError);
  throw new Error("Could not create the lead. Please try again.");
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

  if (params.status) where.status = statusFilter(params.status);
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

export async function updateLead(
  id: string,
  data: z.infer<typeof LeadSchema>
): Promise<{ success: true } | { success: false; errors: Record<string, string> }> {
  const session = await requireClient();
  const validation = LeadSchema.safeParse(data);
  if (!validation.success) {
    const errors = fieldErrors(validation.error);
    logValidationError(validation.error, "updateLead");
    return { success: false, errors };
  }

  const existing = await db.lead.findFirst({ where: { id, clientId: session.id } });
  if (!existing) return { success: false, errors: { _form: "Lead not found." } };

  // The update itself is scoped to the client as well, so the write can only
  // ever touch a lead that belongs to the session's client.
  const updated = await db.lead.updateMany({
    where: { id, clientId: session.id },
    data: {
      ...validation.data,
      nextFollowUpDate: validation.data.nextFollowUpDate ? new Date(validation.data.nextFollowUpDate) : null,
    },
  });
  if (updated.count === 0) {
    return { success: false, errors: { _form: "Lead not found." } };
  }

  await db.activityLog.create({
    data: {
      clientId: session.id,
      leadId: id,
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: id,
      details: `Updated lead ${existing.name}`,
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

  const imported: { id: string; leadCode: string; name: string; source: string }[] = [];
  const client = await getClientIdentity(db, session.id);
  if (!client) throw new Error("Client account not found");

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

    let lastError: { message?: string } | null = null;
    let created = false;

    // Retry on a lead code collision (two rows imported at the same moment).
    for (let attempt = 0; attempt < LEAD_CODE_ATTEMPTS; attempt++) {
      try {
        const leadCode = await generateLeadCode(session.id, client.clientCode);
        const lead = await db.lead.create({
          data: {
            ...validation.data,
            leadCode,
            clientId: session.id,
          }
        });
        imported.push({
          id: lead.id,
          leadCode: lead.leadCode,
          name: lead.name,
          source: lead.source,
        });
        results.successCount++;
        created = true;
        break;
      } catch (e: any) {
        lastError = e;
        if (!isUniqueViolation(e)) break;
      }
    }

    if (!created) {
      results.errors.push({ row: i + 1, error: lastError?.message ?? "Import failed" });
    }
  }

  if (results.successCount > 0) {
    await db.$transaction(async (tx) => {
      await tx.activityLog.create({
        data: {
          clientId: session.id,
          action: "LEADS_IMPORTED",
          details: `Imported ${results.successCount} leads`,
        }
      });

      // One summary notification per side (client + admin) so a 500 row
      // import does not flood the bell.
      await notifyNewLeads(tx, {
        clientId: client.id,
        clientCode: client.clientCode,
        clientName: client.clientName,
        leads: imported,
      });
    });
    revalidatePath("/client/leads");
  }

  return results;
}
