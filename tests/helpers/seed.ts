import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Test fixtures.
 *
 * Two active clients (A and B) plus one inactive client, each with their own
 * leads, follow-ups, conversions and notifications. Client A's data is
 * "secret" — no test may ever expose it to client B.
 */

export interface Fixtures {
  admin: { id: string; email: string; password: string };
  clientA: { id: string; clientCode: string; clientName: string; password: string };
  clientB: { id: string; clientCode: string; clientName: string; password: string };
  clientInactive: { id: string; clientCode: string; clientName: string; password: string };
  leadA1: { id: string; leadCode: string; name: string; mobile: string };
  leadA2: { id: string; leadCode: string; name: string; mobile: string };
  leadB1: { id: string; leadCode: string; name: string; mobile: string };
  leadB2: { id: string; leadCode: string; name: string; mobile: string };
  leadBLost: { id: string; leadCode: string; name: string; mobile: string };
  followUpA: { id: string };
  conversionA: { id: string };
  conversionB: { id: string };
}

/** Wipe every table (the test database only). */
export async function resetDatabase() {
  await db.loginAttempt.deleteMany();
  await db.notification.deleteMany();
  await db.activityLog.deleteMany();
  await db.conversion.deleteMany();
  await db.followUp.deleteMany();
  await db.lead.deleteMany();
  await db.client.deleteMany();
  await db.user.deleteMany();
}

export async function seedFixtures(): Promise<Fixtures> {
  await resetDatabase();

  const adminPassword = "AdminPass123!";
  const clientPassword = "ClientPass123!";

  const admin = await db.user.create({
    data: {
      name: "Test Admin",
      email: "admin@test.local",
      passwordHash: await bcrypt.hash(adminPassword, 4),
      role: "ADMIN",
    },
  });

  const clientA = await db.client.create({
    data: {
      clientCode: "11111",
      clientName: "Client A",
      businessName: "Client A Business",
      passwordHash: await bcrypt.hash(clientPassword, 4),
      status: "ACTIVE",
    },
  });

  const clientB = await db.client.create({
    data: {
      clientCode: "22222",
      clientName: "Client B",
      businessName: "Client B Business",
      passwordHash: await bcrypt.hash(clientPassword, 4),
      status: "ACTIVE",
    },
  });

  const clientInactive = await db.client.create({
    data: {
      clientCode: "33333",
      clientName: "Client Inactive",
      businessName: "Inactive Business",
      passwordHash: await bcrypt.hash(clientPassword, 4),
      status: "INACTIVE",
    },
  });

  // --- Client A's leads (the secret data) ---
  const leadA1 = await db.lead.create({
    data: {
      leadCode: "LD-11111-001",
      clientId: clientA.id,
      name: "Alpha Customer",
      mobile: "9000000001",
      source: "WHATSAPP",
      campaignName: "A Campaign",
      status: "NEW_LEAD",
      nextFollowUpDate: new Date(),
      remarks: "A secret remark",
    },
  });

  const leadA2 = await db.lead.create({
    data: {
      leadCode: "LD-11111-002",
      clientId: clientA.id,
      name: "Alpha Converted Customer",
      mobile: "9000000002",
      source: "INSTAGRAM",
      campaignName: "A Campaign",
      status: "CONVERTED",
      remarks: "A secret converted remark",
    },
  });

  // --- Client B's leads ---
  const leadB1 = await db.lead.create({
    data: {
      leadCode: "LD-22222-001",
      clientId: clientB.id,
      name: "Beta Customer",
      mobile: "9000000003",
      source: "FACEBOOK",
      campaignName: "B Campaign",
      status: "NEW_LEAD",
      nextFollowUpDate: new Date(),
    },
  });

  const leadB2 = await db.lead.create({
    data: {
      leadCode: "LD-22222-002",
      clientId: clientB.id,
      name: "Beta Converted Customer",
      mobile: "9000000004",
      source: "OTHER",
      campaignName: "B Campaign",
      status: "CONVERTED",
    },
  });

  const leadBLost = await db.lead.create({
    data: {
      leadCode: "LD-22222-003",
      clientId: clientB.id,
      name: "Beta Lost Customer",
      mobile: "9000000005",
      source: "OTHER",
      campaignName: "B Campaign",
      status: "LOST",
      lostReason: "B secret lost reason",
    },
  });

  // --- Follow-up (belongs to A) ---
  const followUpA = await db.followUp.create({
    data: {
      leadId: leadA1.id,
      clientId: clientA.id,
      stage: "INITIAL_CONTACT",
      status: "CONTACTED",
      note: "A secret follow-up note",
      customerResponse: "A secret customer response",
      updatedByRole: "CLIENT",
      updatedById: clientA.id,
    },
  });

  // --- Conversion (belongs to A) ---
  const conversionA = await db.conversion.create({
    data: {
      leadId: leadA2.id,
      clientId: clientA.id,
      customerName: "A Secret Converted Customer",
      contactNumber: "9000000002",
      productService: "A Secret Product",
      orderValue: 99999,
      remarks: "A secret conversion remark",
    },
  });

  // --- Conversion (belongs to B) ---
  const conversionB = await db.conversion.create({
    data: {
      leadId: leadB2.id,
      clientId: clientB.id,
      customerName: "Beta Converted Customer",
      contactNumber: "9000000004",
      productService: "Beta Product",
      orderValue: 1234,
    },
  });

  // --- Notifications ---
  await db.notification.create({
    data: {
      clientId: clientA.id,
      type: "NEW_LEAD",
      title: "A secret client notification",
      message: "A secret notification message",
      link: `/client/leads/${leadA1.id}`,
      isRead: false,
    },
  });
  await db.notification.create({
    data: {
      clientId: clientB.id,
      type: "NEW_LEAD",
      title: "B client notification",
      message: "B notification message",
      link: `/client/leads/${leadB1.id}`,
      isRead: false,
    },
  });
  await db.notification.create({
    data: {
      clientId: null,
      type: "NEW_LEAD",
      title: "Admin notification",
      message: "Admin notification message",
      link: `/admin/leads/${leadA1.id}`,
      isRead: false,
    },
  });

  return {
    admin: { id: admin.id, email: admin.email, password: adminPassword },
    clientA: {
      id: clientA.id,
      clientCode: clientA.clientCode,
      clientName: clientA.clientName,
      password: clientPassword,
    },
    clientB: {
      id: clientB.id,
      clientCode: clientB.clientCode,
      clientName: clientB.clientName,
      password: clientPassword,
    },
    clientInactive: {
      id: clientInactive.id,
      clientCode: clientInactive.clientCode,
      clientName: clientInactive.clientName,
      password: clientPassword,
    },
    leadA1: {
      id: leadA1.id,
      leadCode: leadA1.leadCode,
      name: leadA1.name,
      mobile: leadA1.mobile,
    },
    leadA2: {
      id: leadA2.id,
      leadCode: leadA2.leadCode,
      name: leadA2.name,
      mobile: leadA2.mobile,
    },
    leadB1: {
      id: leadB1.id,
      leadCode: leadB1.leadCode,
      name: leadB1.name,
      mobile: leadB1.mobile,
    },
    leadB2: {
      id: leadB2.id,
      leadCode: leadB2.leadCode,
      name: leadB2.name,
      mobile: leadB2.mobile,
    },
    leadBLost: {
      id: leadBLost.id,
      leadCode: leadBLost.leadCode,
      name: leadBLost.name,
      mobile: leadBLost.mobile,
    },
    followUpA: { id: followUpA.id },
    conversionA: { id: conversionA.id },
    conversionB: { id: conversionB.id },
  };
}

/** Strings that must never appear in output rendered for client B. */
export const CLIENT_A_SECRETS = [
  "Alpha Customer",
  "Alpha Converted Customer",
  "A secret remark",
  "A secret follow-up note",
  "A secret customer response",
  "A Secret Converted Customer",
  "A Secret Product",
  "A secret conversion remark",
  "A secret client notification",
  "A secret notification message",
  "LD-11111-001",
  "LD-11111-002",
  "9000000001",
  "9000000002",
];
