"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export interface GlobalSearchResult {
  id: string;
  leadCode: string;
  name: string;
  mobile: string;
  status: string;
  clientId: string;
  clientCode: string;
  clientName: string;
}

/**
 * Global lead search across every client. Searches by name, mobile number or
 * Lead ID. Admin-only — the session is verified before any query runs.
 */
export async function searchLeads(
  query?: string
): Promise<{ success: true; results: GlobalSearchResult[] } | { success: false; error: string }> {
  await requireAdmin();

  const term = (query || "").trim();
  if (!term) return { success: true, results: [] };

  try {
    const leads = await db.lead.findMany({
      where: {
        OR: [
          // PostgreSQL LIKE is case sensitive — "mode: insensitive" keeps the
          // search case insensitive.
          { name: { contains: term, mode: "insensitive" } },
          { mobile: { contains: term, mode: "insensitive" } },
          { leadCode: { contains: term, mode: "insensitive" } },
        ],
      },
      include: {
        client: { select: { id: true, clientCode: true, clientName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      success: true,
      results: leads.map((lead) => ({
        id: lead.id,
        leadCode: lead.leadCode,
        name: lead.name,
        mobile: lead.mobile,
        status: lead.status,
        clientId: lead.client.id,
        clientCode: lead.client.clientCode,
        clientName: lead.client.clientName,
      })),
    };
  } catch (e) {
    console.error("searchLeads error:", e);
    return { success: false, error: "Search failed. Please try again." };
  }
}
