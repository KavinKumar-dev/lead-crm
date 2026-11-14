import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { loginAsClient, logout } from "./helpers/session";
import { CLIENT_A_SECRETS, Fixtures, seedFixtures } from "./helpers/seed";
import { containsText, renderStrings } from "./helpers/render";

// Server actions under test.
import {
  createLead,
  getLeadDetails,
  getLeads,
  importLeads,
  updateLead,
} from "@/app/client/(protected)/leads/actions";
import { addFollowUp, getDueFollowUps } from "@/app/client/(protected)/leads/follow-up-actions";
import {
  markAsConverted,
  markAsLost,
} from "@/app/client/(protected)/leads/conversion-actions";
import { getDashboardStats } from "@/app/client/(protected)/dashboard/actions";
import { getClientReport } from "@/app/client/(protected)/reports/actions";
import { getNotificationFeed } from "@/lib/notifications";

/**
 * Client B must never see or touch Client A's data.
 */
describe("client isolation", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    fx = await seedFixtures();
  });

  beforeEach(async () => {
    logout();
    await loginAsClient(fx.clientB.id, fx.clientB.clientName);
  });

  // ------------------------------------------------------------------
  // Reading a lead
  // ------------------------------------------------------------------
  it("cannot read Client A's lead details", async () => {
    const lead = await getLeadDetails(fx.leadA1.id);
    expect(lead).toBeNull();
  });

  it("cannot read Client A's lead through the lead details page", async () => {
    const LeadDetailsPage = (
      await import("@/app/client/(protected)/leads/[id]/page")
    ).default;

    await expect(LeadDetailsPage({ params: { id: fx.leadA1.id } })).rejects.toThrow(
      /NEXT_NOT_FOUND/
    );
  });

  it("cannot see Client A's follow-up history on Client B's own lead page", async () => {
    // Client B's own lead page renders only its own history.
    const LeadDetailsPage = (
      await import("@/app/client/(protected)/leads/[id]/page")
    ).default;
    const element = await LeadDetailsPage({ params: { id: fx.leadB1.id } });
    const strings = (await import("./helpers/render")).collectStrings(element);

    for (const secret of CLIENT_A_SECRETS) {
      expect(containsText(strings, secret)).toBe(false);
    }
  });

  // ------------------------------------------------------------------
  // Editing a lead
  // ------------------------------------------------------------------
  it("cannot edit Client A's lead", async () => {
    const before = await db.lead.findUnique({ where: { id: fx.leadA1.id } });

    const result = await updateLead(fx.leadA1.id, {
      name: "Hijacked By B",
      mobile: "9111111111",
      source: "OTHER",
      campaignName: "B Campaign",
      nextFollowUpDate: null,
      remarks: "B was here",
    });

    expect(result.success).toBe(false);

    const after = await db.lead.findUnique({ where: { id: fx.leadA1.id } });
    expect(after?.name).toBe(before?.name);
    expect(after?.remarks).toBe(before?.remarks);
    expect(after?.mobile).toBe(before?.mobile);
  });

  it("cannot update a lead that does not exist", async () => {
    const result = await updateLead("does-not-exist", {
      name: "Whatever",
      mobile: "9111111111",
      source: "OTHER",
      campaignName: "B Campaign",
      nextFollowUpDate: null,
      remarks: null,
    });
    expect(result.success).toBe(false);
  });

  // ------------------------------------------------------------------
  // Follow-ups
  // ------------------------------------------------------------------
  it("cannot add a follow-up to Client A's lead", async () => {
    const countBefore = await db.followUp.count({
      where: { leadId: fx.leadA1.id },
    });

    const result = await addFollowUp(fx.leadA1.id, {
      stage: "FOLLOW_UP_1",
      status: "CONTACTED",
      note: "B should not be able to write this",
    });

    expect(result.success).toBe(false);

    const countAfter = await db.followUp.count({
      where: { leadId: fx.leadA1.id },
    });
    expect(countAfter).toBe(countBefore);

    const lead = await db.lead.findUnique({ where: { id: fx.leadA1.id } });
    expect(lead?.status).toBe("NEW_LEAD");
  });

  it("does not receive Client A's leads in the due follow-ups list", async () => {
    const leads = await getDueFollowUps();
    const ids = leads.map((l) => l.id);
    expect(ids).not.toContain(fx.leadA1.id);
    expect(ids).toContain(fx.leadB1.id);
  });

  // ------------------------------------------------------------------
  // Conversion / loss
  // ------------------------------------------------------------------
  it("cannot convert Client A's lead", async () => {
    const result = await markAsConverted(fx.leadA1.id, {
      customerName: "B Hijack",
      contactNumber: "9000000001",
      conversionDate: new Date().toISOString(),
      productService: "B Product",
      orderValue: 1,
    });

    expect(result.success).toBe(false);

    const conversions = await db.conversion.findMany({
      where: { leadId: fx.leadA1.id },
    });
    expect(conversions).toHaveLength(0);

    const lead = await db.lead.findUnique({ where: { id: fx.leadA1.id } });
    expect(lead?.status).toBe("NEW_LEAD");
  });

  it("cannot mark Client A's lead as lost", async () => {
    const result = await markAsLost(fx.leadA1.id, {
      lostReason: "Not Interested",
      note: "B should not be able to write this",
    });

    expect(result.success).toBe(false);

    const lead = await db.lead.findUnique({ where: { id: fx.leadA1.id } });
    expect(lead?.status).toBe("NEW_LEAD");
    expect(lead?.lostReason).toBeNull();

    const followUps = await db.followUp.count({
      where: { leadId: fx.leadA1.id, status: "LOST" },
    });
    expect(followUps).toBe(0);
  });

  // ------------------------------------------------------------------
  // Lists and search
  // ------------------------------------------------------------------
  it("does not see Client A's leads in the lead list", async () => {
    const { leads, totalCount } = await getLeads({});

    expect(totalCount).toBe(3); // only Client B's leads
    const ids = leads.map((l) => l.id);
    expect(ids).not.toContain(fx.leadA1.id);
    expect(ids).not.toContain(fx.leadA2.id);
    expect(ids).toContain(fx.leadB1.id);
  });

  it("cannot find Client A's leads with the search box", async () => {
    // Search by name, mobile and lead code of Client A's leads.
    for (const term of ["Alpha", "9000000001", "LD-11111-001"]) {
      const { leads, totalCount } = await getLeads({ q: term });
      expect(totalCount).toBe(0);
      expect(leads).toHaveLength(0);
    }
  });

  it("cannot find Client A's leads with a status filter", async () => {
    const { leads } = await getLeads({ status: "CONVERTED" });
    const ids = leads.map((l) => l.id);
    expect(ids).not.toContain(fx.leadA2.id);
    expect(ids).toContain(fx.leadB2.id);
  });

  // ------------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------------
  it("does not count Client A's leads on the dashboard", async () => {
    const result = await getDashboardStats({ range: "last30days" });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Only Client B's three leads — never Client A's.
    expect(result.stats.kpis.total).toBe(3);
    expect(result.stats.kpis.converted).toBe(1); // only Client B's conversion
    expect(result.stats.kpis.lost).toBe(1); // only Client B's lost lead
    expect(result.stats.today.newLeads).toBe(3); // not 6 (which would include A's)
  });

  // ------------------------------------------------------------------
  // Reports
  // ------------------------------------------------------------------
  it("does not include Client A's data in the report preview", async () => {
    const result = await getClientReport({
      report: "conversions",
      range: "last30days",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const serialized = JSON.stringify(result.data);
    for (const secret of CLIENT_A_SECRETS) {
      expect(serialized.includes(secret)).toBe(false);
    }
  });

  it("does not include Client A's follow-ups in the follow-up report", async () => {
    const result = await getClientReport({
      report: "follow_ups",
      range: "last30days",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const serialized = JSON.stringify(result.data);
    expect(serialized.includes("A secret follow-up note")).toBe(false);
    expect(serialized.includes("Alpha Customer")).toBe(false);
  });

  // ------------------------------------------------------------------
  // Notifications
  // ------------------------------------------------------------------
  it("does not receive Client A's notifications", async () => {
    const feed = await getNotificationFeed("client", fx.clientB.id);

    const serialized = JSON.stringify(feed);
    expect(serialized.includes("A secret client notification")).toBe(false);
    expect(serialized.includes("A secret notification message")).toBe(false);

    const ids = feed.notifications.map((n) => n.id);
    const aNotifications = await db.notification.findMany({
      where: { clientId: fx.clientA.id },
    });
    for (const a of aNotifications) {
      expect(ids).not.toContain(a.id);
    }
  });

  it("cannot mark Client A's notifications as read", async () => {
    const aNotification = await db.notification.findFirst({
      where: { clientId: fx.clientA.id },
    });
    expect(aNotification).not.toBeNull();

    const { markAllNotificationsRead, markNotificationRead } = await import(
      "@/lib/notifications"
    );

    const single = await markNotificationRead(
      "client",
      fx.clientB.id,
      aNotification!.id
    );
    expect(single).toBe(0); // nothing updated — it belongs to client A

    const all = await markAllNotificationsRead("client", fx.clientB.id);
    expect(all).toBe(1); // only client B's own notification

    const after = await db.notification.findUnique({
      where: { id: aNotification!.id },
    });
    expect(after?.isRead).toBe(false);
  });

  // ------------------------------------------------------------------
  // Conversions and lost pages
  // ------------------------------------------------------------------
  it("does not render Client A's conversions on the converted page", async () => {
    const ConvertedPage = (
      await import("@/app/client/(protected)/converted/page")
    ).default;

    const strings = await renderStrings(() => ConvertedPage());
    for (const secret of CLIENT_A_SECRETS) {
      expect(containsText(strings, secret)).toBe(false);
    }
    expect(containsText(strings, "A Secret Converted Customer")).toBe(false);
  });

  it("does not render Client A's lost leads on the lost page", async () => {
    const LostPage = (await import("@/app/client/(protected)/lost/page")).default;
    const strings = await renderStrings(() => LostPage());

    for (const secret of CLIENT_A_SECRETS) {
      expect(containsText(strings, secret)).toBe(false);
    }
  });

  // ------------------------------------------------------------------
  // Writes
  // ------------------------------------------------------------------
  it("creates leads under its own client id only", async () => {
    const result = await createLead({
      name: "B New Lead",
      mobile: "9555555555",
      source: "WHATSAPP",
      campaignName: "B Campaign",
      nextFollowUpDate: null,
      remarks: null,
    });

    expect(result.success).toBe(true);

    const lead = await db.lead.findUnique({
      where: { id: result.leadId },
    });
    expect(lead?.clientId).toBe(fx.clientB.id);

    // The lead code is scoped to the client: it must not reveal how many
    // leads the other clients have.
    expect(lead?.leadCode).toMatch(new RegExp(`^LD-${fx.clientB.clientCode}-`));
    expect(lead?.leadCode).not.toContain(fx.clientA.clientCode);
  });

  it("imports leads under its own client id only", async () => {
    const result = await importLeads([
      { name: "B Import One", mobile: "9666666666", source: "FACEBOOK" },
      { name: "B Import Two", mobile: "9666666667", source: "WHATSAPP" },
    ]);

    expect(result.successCount).toBe(2);

    const leads = await db.lead.findMany({
      where: { name: { startsWith: "B Import" } },
    });
    expect(leads).toHaveLength(2);
    for (const lead of leads) {
      expect(lead.clientId).toBe(fx.clientB.id);
    }
  });

  it("does not report a duplicate for a mobile number owned by Client A", async () => {
    const { checkDuplicateLead } = await import(
      "@/app/client/(protected)/leads/actions"
    );
    // The duplicate check is scoped to the client, so A's mobile is unknown
    // to B and B is free to use it.
    expect(await checkDuplicateLead(fx.leadA1.mobile)).toBe(false);
  });
});
