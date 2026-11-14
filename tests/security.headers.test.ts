import { describe, it, expect } from "vitest";
import { createRequire } from "module";
import path from "path";

/**
 * Security headers configured in next.config.js.
 */
describe("security headers", () => {
  const require = createRequire(import.meta.url);
  const config = require(path.join(process.cwd(), "next.config.js"));

  it("sets the required headers on every route", async () => {
    const rules = await config.headers();

    expect(Array.isArray(rules)).toBe(true);
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");

    const headers = rules[0].headers as { key: string; value: string }[];
    const byKey = new Map(headers.map((h) => [h.key.toLowerCase(), h.value]));

    expect(byKey.get("x-frame-options")).toBe("DENY");
    expect(byKey.get("x-content-type-options")).toBe("nosniff");
    expect(byKey.get("referrer-policy")).toBeTruthy();
  });
});
