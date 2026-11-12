"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateClientSchema = z.object({
  clientName: z.string().min(2),
  businessName: z.string().min(2),
  password: z.string().min(6),
});

const UpdateClientSchema = z.object({
  id: z.string(),
  clientName: z.string().min(2),
  businessName: z.string().min(2),
});

const ResetPasswordSchema = z.object({
  id: z.string(),
  newPassword: z.string().min(6),
});

async function generateUniqueClientCode() {
  let attempts = 0;
  while (attempts < 10) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const existing = await db.client.findUnique({ where: { clientCode: code } });
    if (!existing) return code;
    attempts++;
  }
  throw new Error("Failed to generate a unique Client ID");
}

export async function getClients(search?: string) {
  await requireAdmin();
  
  return await db.client.findMany({
    where: search ? {
      OR: [
        { clientCode: { contains: search } },
        { clientName: { contains: search } },
        { businessName: { contains: search } },
      ]
    } : undefined,
    include: {
      _count: {
        select: { leads: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createClient(data: z.infer<typeof CreateClientSchema>) {
  const session = await requireAdmin();
  const validation = CreateClientSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid input");

  const { clientName, businessName, password } = validation.data;
  const clientCode = await generateUniqueClientCode();
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await db.client.create({
    data: {
      clientCode,
      clientName,
      businessName,
      passwordHash,
      status: "ACTIVE",
    }
  });

  await db.activityLog.create({
    data: {
      userId: session.id,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      details: `Created client ${clientName} (${clientCode})`,
    }
  });

  revalidatePath("/admin/clients");
  return { success: true, clientCode };
}

export async function updateClient(data: z.infer<typeof UpdateClientSchema>) {
  const session = await requireAdmin();
  const validation = UpdateClientSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid input");

  const { id, clientName, businessName } = validation.data;

  const client = await db.client.update({
    where: { id },
    data: { clientName, businessName }
  });

  await db.activityLog.create({
    data: {
      userId: session.id,
      action: "CLIENT_UPDATED",
      entityType: "Client",
      entityId: client.id,
      details: `Updated client details for ${client.clientCode}`,
    }
  });

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function toggleClientStatus(id: string) {
  const session = await requireAdmin();
  
  const current = await db.client.findUnique({ where: { id } });
  if (!current) throw new Error("Client not found");

  const newStatus = current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await db.client.update({
    where: { id },
    data: { status: newStatus }
  });

  await db.activityLog.create({
    data: {
      userId: session.id,
      action: "STATUS_UPDATED",
      entityType: "Client",
      entityId: id,
      details: `Changed status of client ${current.clientCode} to ${newStatus}`,
    }
  });

  revalidatePath("/admin/clients");
}

export async function resetClientPassword(data: z.infer<typeof ResetPasswordSchema>) {
  const session = await requireAdmin();
  const validation = ResetPasswordSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid input");

  const { id, newPassword } = validation.data;
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const client = await db.client.update({
    where: { id },
    data: { passwordHash }
  });

  await db.activityLog.create({
    data: {
      userId: session.id,
      action: "PASSWORD_RESET",
      entityType: "Client",
      entityId: id,
      details: `Reset password for client ${client.clientCode}`,
    }
  });

  return { success: true };
}
