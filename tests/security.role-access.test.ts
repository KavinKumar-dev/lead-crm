import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { loginAsAdmin, loginAsClient, logout } from "./helpers/session";
import { Fixtures, seedFixtures } from "./helpers/seed";

/**
 * A client must not be able to reach any admin route or action, and an
 * admin must not be able to reach any client route or action.
 */

const ADMIN_ACTIONS: Array<[string, () => Promise<unknown>]> = [
  ["getAdminLeads", async () => (await import("@/app/admin/(protected)/leads/actions")).getAdminLeads({})],
  ["getAdminLeadDetails", async () => (await import("@/app/admin/(protected)/leads/actions")).getAdminLeadDetails("x")],
  ["updateLeadAsAdmin", async () => (await import("@/app/admin/(protected)/leads/actions")).updateLeadAsAdmin("x", { name: "n", mobile: "9000000000", source: "OTHER", campaignName: "c" })],
  ["searchLeads", async () => (await import("@/app/admin/(protected)/search/actions")).searchLeads("a")],
  ["getAdminDashboard", async () => (await import("@/app/admin/(protected)/dashboard/actions")).getAdminDashboard({})],
  ["getClientDirectory", async () => (await import("@/app/admin/(protected)/dashboard/actions")).getClientDirectory()],
  ["getClients", async () => (await import("@/app/admin/(protected)/clients/actions")).getClients()],
  ["createClient", async () => (await import("@/app/admin/(protected)/clients/actions")).createClient({ clientName: "X", businessName: "Y", password: "secret1" })],
  ["updateClient", async () => (await import("@/app/admin/(protected)/clients/actions")).updateClient({ id: "x", clientName: "X", businessName: "Y" })],
  ["toggleClientStatus", async () => (await import("@/app/admin/(protected)/clients/actions")).toggleClientStatus("x")],
  ["resetClientPassword", async () => (await import("@/app/admin/(protected)/clients/actions")).resetClientPassword({ id: "x", newPassword: "secret1" })],
  ["getAdminReport", async () => (await import("@/app/admin/(protected)/reports/actions")).getAdminReport({ report: "overall_leads" })],
  ["getReportClientOptions", async () => (await import("@/app/admin/(protected)/reports/actions")).getReportClientOptions()],
];

const CLIENT_ACTIONS: Array<[string, () => Promise<unknown>]> = [
  ["getLeads", async () => (await import("@/app/client/(protected)/leads/actions")).getLeads({})],
  ["getLeadDetails", async () => (await import("@/app/client/(protected)/leads/actions")).getLeadDetails("x")],
  ["createLead", async () => (await import("@/app/client/(protected)/leads/actions")).createLead({ name: "Some Name", mobile: "9000000000", source: "OTHER", campaignName: "c" })],
  ["updateLead", async () => (await import("@/app/client/(protected)/leads/actions")).updateLead("x", { name: "Some Name", mobile: "9000000000", source: "OTHER", campaignName: "c" })],
  ["checkDuplicateLead", async () => (await import("@/app/client/(protected)/leads/actions")).checkDuplicateLead("9000000000")],
  ["importLeads", async () => (await import("@/app/client/(protected)/leads/actions")).importLeads([])],
  ["addFollowUp", async () => (await import("@/app/client/(protected)/leads/follow-up-actions")).addFollowUp("x", { stage: "INITIAL_CONTACT", status: "CONTACTED" })],
  ["getDueFollowUps", async () => (await import("@/app/client/(protected)/leads/follow-up-actions")).getDueFollowUps()],
  ["markAsConverted", async () => (await import("@/app/client/(protected)/leads/conversion-actions")).markAsConverted("x", { customerName: "Someone", contactNumber: "9000000000", conversionDate: new Date().toISOString(), productService: "P" })],
  ["markAsLost", async () => (await import("@/app/client/(protected)/leads/conversion-actions")).markAsLost("x", { lostReason: "No Response" })],
  ["getDashboardStats", async () => (await import("@/app/client/(protected)/dashboard/actions")).getDashboardStats({})],
  ["getClientReport", async () => (await import("@/app/client/(protected)/reports/actions")).getClientReport({})],
];

describe("role based access control", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    fx = await seedFixtures();
  });

  beforeEach(() => {
    logout();
  });

  it("blocks a client from every admin server action", async () => {
    await loginAsClient(fx.clientB.id, fx.clientB.clientName);

    for (const [name, run] of ADMIN_ACTIONS) {
      await expect(run(), `admin action "${name}" must reject a client`).rejects.toThrow(
        /NEXT_REDIRECT:\/admin\/login/
      );
    }
  });

  it("blocks an admin from every client server action", async () => {
    await loginAsAdmin(fx.admin.id, "Test Admin");

    for (const [name, run] of CLIENT_ACTIONS) {
      await expect(run(), `client action "${name}" must reject an admin`).rejects.toThrow(
        /NEXT_REDIRECT:\/client\/login/
      );
    }
  });

  it("blocks a client from the admin API routes", async () => {
    await loginAsClient(fx.clientB.id, fx.clientB.clientName);

    const adminNotifications = await import("@/app/api/notifications/admin/route");
    const adminReports = await import("@/app/api/reports/admin/route");

    await expect(adminNotifications.GET()).rejects.toThrow(
      /NEXT_REDIRECT:\/admin\/login/
    );
    await expect(
      adminReports.GET(new Request("http://localhost/api/reports/admin?report=overall_leads"))
    ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/login/);
  });

  it("blocks an admin from the client API routes", async () => {
    await loginAsAdmin(fx.admin.id, "Test Admin");

    const clientNotifications = await import("@/app/api/notifications/client/route");
    const clientReports = await import("@/app/api/reports/client/route");

    await expect(clientNotifications.GET()).rejects.toThrow(
      /NEXT_REDIRECT:\/client\/login/
    );
    await expect(
      clientReports.GET(
        new Request("http://localhost/api/reports/client?report=daily_leads")
      )
    ).rejects.toThrow(/NEXT_REDIRECT:\/client\/login/);
  });

  it("blocks an anonymous visitor from the protected API routes", async () => {
    const clientNotifications = await import("@/app/api/notifications/client/route");
    const adminNotifications = await import("@/app/api/notifications/admin/route");

    await expect(clientNotifications.GET()).rejects.toThrow(
      /NEXT_REDIRECT:\/client\/login/
    );
    await expect(adminNotifications.GET()).rejects.toThrow(
      /NEXT_REDIRECT:\/admin\/login/
    );
  });

  it("lets the admin read every client's data", async () => {
    await loginAsAdmin(fx.admin.id, "Test Admin");

    const { getAdminLeads } = await import("@/app/admin/(protected)/leads/actions");
    const data = await getAdminLeads({});
    const ids = data.leads.map((l: { id: string }) => l.id);

    expect(ids).toContain(fx.leadA1.id);
    expect(ids).toContain(fx.leadB1.id);
  });
});
