"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function getAdminStats() {
  await requireAdmin();
  
  const totalClients = await db.client.count();
  const activeClients = await db.client.count({ where: { status: "ACTIVE" } });
  const inactiveClients = await db.client.count({ where: { status: "INACTIVE" } });

  return {
    totalClients,
    activeClients,
    inactiveClients,
  };
}
