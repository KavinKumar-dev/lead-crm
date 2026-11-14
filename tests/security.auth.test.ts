import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import { logout } from "./helpers/session";
import { Fixtures, seedFixtures } from "./helpers/seed";

/**
 * Login, session cookie and account status.
 */
describe("authentication", () => {
  let fx: Fixtures;

  beforeAll(async () => {
    fx = await seedFixtures();
  });

  beforeEach(() => {
    logout();
  });

  afterEach(() => {
    logout();
  });

  it("logs an active client in and sets a hardened session cookie", async () => {
    const { POST } = await import("@/app/api/auth/client-login/route");
    const { cookieStore } = await import("./helpers/cookieStore");

    const res = await POST(
      new Request("http://localhost/api/auth/client-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientCode: fx.clientA.clientCode,
          password: fx.clientA.password,
        }),
      })
    );

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.success).toBe(true);

    // The cookie must be httpOnly, sameSite=lax and scoped to the app.
    expect(cookieStore.current.session).toBeTruthy();

    const options = cookieStore.options.session;
    expect(options).toBeDefined();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.secure).toBe(false); // not production
  });

  it("marks the session cookie secure in production", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV is read-only in the types
    process.env.NODE_ENV = "production";
    try {
      vi.resetModules();
      const { POST } = await import("@/app/api/auth/client-login/route");
      const { cookieStore } = await import("./helpers/cookieStore");

      const res = await POST(
        new Request("http://localhost/api/auth/client-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientCode: fx.clientA.clientCode,
            password: fx.clientA.password,
          }),
        })
      );

      expect(res.status).toBe(200);
      expect(cookieStore.options.session.secure).toBe(true);
    } finally {
      // @ts-expect-error NODE_ENV is read-only in the types
      process.env.NODE_ENV = original;
      vi.resetModules();
    }
  });

  it("refuses to log an INACTIVE client in", async () => {
    const { POST } = await import("@/app/api/auth/client-login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/client-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientCode: fx.clientInactive.clientCode,
          password: fx.clientInactive.password,
        }),
      })
    );

    expect(res.status).toBe(401);
    const payload = await res.json();
    expect(payload.success).toBeUndefined();
  });

  it("refuses a wrong password", async () => {
    const { POST } = await import("@/app/api/auth/client-login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/client-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientCode: fx.clientA.clientCode,
          password: "wrong-password",
        }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("refuses a malformed JSON body without crashing", async () => {
    const { POST } = await import("@/app/api/auth/client-login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/client-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json-at-all",
      })
    );

    expect(res.status).toBe(400);
  });

  it("locks out a client whose account was deactivated while it was logged in", async () => {
    const { loginAsClient } = await import("./helpers/session");
    const { requireClient } = await import("@/lib/auth");

    await loginAsClient(fx.clientA.id, fx.clientA.clientName);
    // The session is valid ...
    await expect(requireClient()).resolves.toMatchObject({ role: "CLIENT" });

    // ... but the account is deactivated.
    await db.client.update({
      where: { id: fx.clientA.id },
      data: { status: "INACTIVE" },
    });

    await expect(requireClient()).rejects.toThrow(/NEXT_REDIRECT:\/client\/login/);

    // Restore for the other tests.
    await db.client.update({
      where: { id: fx.clientA.id },
      data: { status: "ACTIVE" },
    });
  });

  it("requires SESSION_SECRET to be defined", async () => {
    const original = process.env.SESSION_SECRET;
    try {
      delete process.env.SESSION_SECRET;
      vi.resetModules();
      await expect(import("@/lib/auth")).rejects.toThrow(
        /SESSION_SECRET is not defined/
      );
    } finally {
      process.env.SESSION_SECRET = original;
      vi.resetModules();
    }
  });

  it("rejects a session cookie signed with a different secret", async () => {
    const { signSession } = await import("./helpers/session");
    const { getSession } = await import("@/lib/auth");
    const { setCookie } = await import("./helpers/cookieStore");

    // Sign with a forged key.
    const { SignJWT } = await import("jose");
    const forged = await new SignJWT({ role: "CLIENT", id: fx.clientA.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode("a-completely-different-secret"));

    setCookie("session", forged);
    expect(await getSession()).toBeNull();

    // Sanity check: a correctly signed cookie still works.
    setCookie("session", await signSession("CLIENT", fx.clientA.id, "x"));
    expect(await getSession()).not.toBeNull();
  });

  it("rejects an expired session cookie", async () => {
    const { getSession } = await import("@/lib/auth");
    const { setCookie } = await import("./helpers/cookieStore");
    const { SignJWT } = await import("jose");

    const expired = await new SignJWT({ role: "CLIENT", id: fx.clientA.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Date.now() - 1000 * 60 * 60 * 24)
      .setExpirationTime(new Date(Date.now() - 1000 * 60 * 60))
      .sign(new TextEncoder().encode(process.env.SESSION_SECRET as string));

    setCookie("session", expired);
    expect(await getSession()).toBeNull();
  });

  it("locks an IP out after 5 failed attempts in 15 minutes", async () => {
    const { db } = await import("@/lib/db");
    const { POST } = await import("@/app/api/auth/client-login/route");

    // Start from a clean counter for this test.
    await db.loginAttempt.deleteMany({ where: { key: "127.0.0.1" } });

    const attempt = () =>
      POST(
        new Request("http://localhost/api/auth/client-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientCode: fx.clientA.clientCode,
            password: "definitely-wrong",
          }),
        })
      );

    // Five failures are allowed.
    for (let i = 0; i < 5; i++) {
      const res = await attempt();
      expect(res.status).toBe(401);
    }

    const afterFive = await db.loginAttempt.findUnique({
      where: { key: "127.0.0.1" },
    });
    expect(afterFive?.count).toBe(5);
    expect(afterFive?.lockedUntil).toBeNull();

    // The sixth attempt is rejected.
    const blocked = await attempt();
    expect(blocked.status).toBe(429);

    const row = await db.loginAttempt.findUnique({
      where: { key: "127.0.0.1" },
    });
    expect(row?.count).toBe(6);
    expect(row?.lockedUntil).not.toBeNull();

    // A correct password is refused too while the IP is locked.
    const correct = await POST(
      new Request("http://localhost/api/auth/client-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientCode: fx.clientA.clientCode,
          password: fx.clientA.password,
        }),
      })
    );
    expect(correct.status).toBe(429);

    await db.loginAttempt.deleteMany({ where: { key: "127.0.0.1" } });
  });

  it("counts only failed attempts towards the limit", async () => {
    const { db } = await import("@/lib/db");
    const { POST } = await import("@/app/api/auth/client-login/route");

    await db.loginAttempt.deleteMany({ where: { key: "127.0.0.1" } });

    // A successful login must not consume an attempt.
    for (let i = 0; i < 6; i++) {
      const res = await POST(
        new Request("http://localhost/api/auth/client-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            clientCode: fx.clientA.clientCode,
            password: fx.clientA.password,
          }),
        })
      );
      expect(res.status).toBe(200);
    }

    const rows = await db.loginAttempt.count({ where: { key: "127.0.0.1" } });
    expect(rows).toBe(0);

    await db.loginAttempt.deleteMany({ where: { key: "127.0.0.1" } });
  });
});
