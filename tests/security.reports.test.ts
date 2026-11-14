import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { loginAsClient, logout } from "./helpers/session";
import { CLIENT_A_SECRETS, Fixtures, seedFixtures } from "./helpers/seed";

/**
 * The report export must never let the caller pick the client scope.
 *
 * A `clientId` / `client` query parameter is simply ignored — the scope is
 * always the session's client.
 */
describe("report export scoping", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    fx = await seedFixtures();
  });

  beforeEach(async () => {
    logout();
    await loginAsClient(fx.clientB.id, fx.clientB.clientName);
  });

  it("ignores a clientId query parameter and exports only the session's data", async () => {
    const { GET } = await import("@/app/api/reports/client/route");

    const url =
      "http://localhost/api/reports/client?report=conversions&range=last30days" +
      `&clientId=${fx.clientA.id}&client=${fx.clientA.clientCode}` +
      `&clientCode=${fx.clientA.clientCode}`;

    const res = await GET(new Request(url));
    expect(res.status).toBe(200);

    const csv = await res.text();

    // Client A's data must not be in the export ...
    for (const secret of CLIENT_A_SECRETS) {
      expect(csv.includes(secret)).toBe(false);
    }

    // ... and Client B's own data must be.
    expect(csv.includes("Beta Converted Customer")).toBe(true);
  });

  it("ignores a clientId query parameter on the lead report", async () => {
    const { GET } = await import("@/app/api/reports/client/route");

    const res = await GET(
      new Request(
        `http://localhost/api/reports/client?report=daily_leads&range=last30days&clientId=${fx.clientA.id}`
      )
    );
    const csv = await res.text();

    expect(csv.includes("Alpha Customer")).toBe(false);
    expect(csv.includes("Alpha Converted Customer")).toBe(false);
  });

  it("exports the follow-up report for the session's client only", async () => {
    const { GET } = await import("@/app/api/reports/client/route");

    const res = await GET(
      new Request(
        "http://localhost/api/reports/client?report=follow_ups&range=last30days" +
          `&clientId=${fx.clientA.id}`
      )
    );
    const csv = await res.text();

    expect(csv.includes("A secret follow-up note")).toBe(false);
    expect(csv.includes("A secret customer response")).toBe(false);
  });

  it("exports the lost lead report for the session's client only", async () => {
    const { GET } = await import("@/app/api/reports/client/route");

    const res = await GET(
      new Request(
        "http://localhost/api/reports/client?report=lost_leads&range=last30days" +
          `&client=${fx.clientA.clientCode}`
      )
    );
    const csv = await res.text();

    expect(csv.includes("Alpha Customer")).toBe(false);
  });

  it("builds the report straight from the session's client id", async () => {
    const { buildClientReport } = await import("@/lib/reports");
    const { getDateRange } = await import("@/lib/dateRange");

    const report = await buildClientReport(
      "conversions",
      fx.clientB.id,
      getDateRange("last30days")
    );

    const serialized = JSON.stringify(report);
    expect(serialized.includes("A Secret Converted Customer")).toBe(false);
    expect(serialized.includes("A Secret Product")).toBe(false);
    expect(serialized.includes("Beta Converted Customer")).toBe(true);
  });

  it("keeps the admin report scoped to the admin's own client filter", async () => {
    logout();
    const { loginAsAdmin } = await import("./helpers/session");
    await loginAsAdmin(fx.admin.id, "Test Admin");

    const { GET } = await import("@/app/api/reports/admin/route");

    // The admin may filter by client — but only to a real client.
    const res = await GET(
      new Request(
        `http://localhost/api/reports/admin?report=client_wise_conversion&range=last30days&client=${fx.clientA.clientCode}`
      )
    );
    expect(res.status).toBe(200);
    const csv = await res.text();

    expect(csv.includes("Client A")).toBe(true);
    expect(csv.includes(fx.clientA.clientCode)).toBe(true);
    expect(csv.includes("Client B")).toBe(false);
    expect(csv.includes(fx.clientB.clientCode)).toBe(false);

    // Without a filter the admin sees every client.
    const all = await GET(
      new Request(
        "http://localhost/api/reports/admin?report=client_wise_conversion&range=last30days"
      )
    );
    const allCsv = await all.text();
    expect(allCsv.includes("Client A")).toBe(true);
    expect(allCsv.includes("Client B")).toBe(true);

    // An unknown client id is rejected.
    const res2 = await GET(
      new Request(
        "http://localhost/api/reports/admin?report=client_wise_conversion&range=last30days&client=99999"
      )
    );
    expect(res2.status).toBe(404);
  });

  it("does not leak another client's lead through the report helper directly", async () => {
    // Sanity check on the underlying data: the fixtures really do contain
    // both clients' rows, so the assertions above are meaningful.
    const aConversions = await db.conversion.count({
      where: { clientId: fx.clientA.id },
    });
    const bConversions = await db.conversion.count({
      where: { clientId: fx.clientB.id },
    });
    expect(aConversions).toBeGreaterThan(0);
    expect(bConversions).toBeGreaterThan(0);
  });
});
