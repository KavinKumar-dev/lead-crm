"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fieldErrors, logValidationError } from "@/lib/validation";
import { getDateRange, istEndOfDay, parseIstDate } from "@/lib/dateRange";
import { TERMINAL_STATUSES } from "@/lib/dashboardStats";
import { statusFilter } from "@/lib/leadFilters";

const AdminLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  source: z.string().min(1, "Source is required"),
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

export interface AdminLeadFilters {
  q?: string;
  client?: string;
  status?: string;
  stage?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  followUp?: string;
  page?: number;
}

const PAGE_SIZE = 20;

/**
 * All leads from every client, with filters and pagination.
 * Admin-only: the session is verified before any query runs.
 */
export async function getAdminLeads(params: AdminLeadFilters) {
  await requireAdmin();

  const page = Math.max(1, params.page || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = {};

  // A status filter may hold several comma-separated statuses.
  const statusWhere = params.status ? statusFilter(params.status) : undefined;

  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { mobile: { contains: params.q } },
      { leadCode: { contains: params.q } },
    ];
  }

  // Filter by client code (5-digit) — resolved to the internal client id.
  if (params.client) {
    const client = await db.client.findUnique({
      where: { clientCode: params.client },
      select: { id: true },
    });
    // Unknown client code -> match nothing rather than leaking other data.
    where.clientId = client ? client.id : "__none__";
  }

  if (params.status) where.status = statusWhere;
  if (params.stage) where.followUpStage = params.stage;
  if (params.source) where.source = params.source;

  // Follow-up due filters (used by the dashboard "Overdue" / "Follow-Ups" tiles).
  // Terminal statuses are always excluded; if a status filter is also active
  // the two are combined with AND so neither silently overwrites the other.
  if (params.followUp === "overdue" || params.followUp === "due") {
    const today = getDateRange("today");
    where.nextFollowUpDate =
      params.followUp === "overdue"
        ? { lt: today.start }
        : { gte: today.start, lte: today.end };
    where.AND = [
      { status: { notIn: TERMINAL_STATUSES } },
      ...(statusWhere ? [{ status: statusWhere }] : []),
    ];
    delete where.status;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    // IST day boundaries, consistent with lib/dateRange.ts
    if (params.startDate) {
      const start = parseIstDate(params.startDate);
      if (start) where.createdAt.gte = start;
    }
    if (params.endDate) {
      const end = parseIstDate(params.endDate);
      if (end) where.createdAt.lte = istEndOfDay(end);
    }
  }

  const [leads, total, clients] = await Promise.all([
    db.lead.findMany({
      where,
      take: PAGE_SIZE,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, clientCode: true, clientName: true } },
      },
    }),
    db.lead.count({ where }),
    db.client.findMany({
      select: { id: true, clientCode: true, clientName: true },
      orderBy: { clientName: "asc" },
    }),
  ]);

  return {
    leads,
    totalPages: Math.ceil(total / PAGE_SIZE),
    totalCount: total,
    currentPage: page,
    clients,
  };
}

/** Lead details for any client (admin view). */
export async function getAdminLeadDetails(id: string) {
  await requireAdmin();

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, clientCode: true, clientName: true } },
      followUps: { orderBy: { createdAt: "desc" } },
      conversion: true,
      activityLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) return null;

  // Resolve the name of whoever recorded each follow-up (client or admin).
  const clientIds = new Set<string>();
  const userIds = new Set<string>();
  for (const fu of lead.followUps) {
    if (!fu.updatedById) continue;
    if (fu.updatedByRole === "ADMIN") userIds.add(fu.updatedById);
    else clientIds.add(fu.updatedById);
  }

  const [clients, users] = await Promise.all([
    clientIds.size
      ? db.client.findMany({
          where: { id: { in: Array.from(clientIds) } },
          select: { id: true, clientName: true },
        })
      : Promise.resolve([]),
    userIds.size
      ? db.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const nameById = new Map<string, string>();
  for (const c of clients) nameById.set(c.id, c.clientName);
  for (const u of users) nameById.set(u.id, u.name);

  return {
    ...lead,
    followUps: lead.followUps.map((fu) => ({
      ...fu,
      updatedByName: fu.updatedById
        ? nameById.get(fu.updatedById) ?? fu.updatedByRole
        : fu.updatedByRole,
    })),
  };
}

/**
 * Admin edit of a lead. The lead is looked up by id (admins may edit any
 * client's lead); an unknown id returns a structured error instead of
 * throwing.
 */
export async function updateLeadAsAdmin(
  id: string,
  data: z.infer<typeof AdminLeadSchema>
): Promise<{ success: true } | { success: false; errors: Record<string, string> }> {
  const session = await requireAdmin();

  const validation = AdminLeadSchema.safeParse(data);
  if (!validation.success) {
    const errors = fieldErrors(validation.error);
    logValidationError(validation.error, "updateLeadAsAdmin");
    return { success: false, errors };
  }

  try {
    const existing = await db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        leadCode: true,
        name: true,
        client: { select: { clientCode: true } },
      },
    });
    if (!existing) {
      return { success: false, errors: { _form: "Lead not found." } };
    }

    const { name, mobile, source, campaignName, nextFollowUpDate, remarks } =
      validation.data;

    const lead = await db.lead.update({
      where: { id },
      data: {
        name,
        mobile,
        source,
        campaignName,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        remarks: remarks ?? null,
      },
    });

    // Activity log records that the ADMIN made the change.
    await db.activityLog.create({
      data: {
        clientId: lead.clientId,
        userId: session.id,
        leadId: lead.id,
        action: "LEAD_UPDATED_BY_ADMIN",
        entityType: "Lead",
        entityId: lead.id,
        details: `Admin ${session.name ?? "Administrator"} updated lead ${lead.leadCode} (${lead.name})`,
      },
    });

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${id}`);
    revalidatePath(`/admin/clients/${existing.client.clientCode}/dashboard`);

    return { success: true };
  } catch (e) {
    console.error("updateLeadAsAdmin error:", e);
    return { success: false, errors: { _form: "Could not save changes. Please try again." } };
  }
}
