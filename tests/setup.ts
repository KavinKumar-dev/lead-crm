import { vi } from "vitest";

/**
 * Vitest setup — runs before every test file.
 *
 * 1. Points the Prisma client at the dedicated test database. This must
 *    happen BEFORE any module that imports lib/db.ts is evaluated.
 * 2. Mocks the Next.js request scoped APIs the server actions rely on
 *    (cookies, redirect, notFound, revalidatePath) so they can be exercised
 *    outside of a running Next.js server.
 */

// --- 1. Test database -------------------------------------------------
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "test-only-session-secret-do-not-use-in-production-0123456789";

if (!process.env.DATABASE_URL.includes("test.db")) {
  throw new Error(
    `Tests must run against a separate test database, not "${process.env.DATABASE_URL}".`
  );
}

// --- 2. Next.js mocks -------------------------------------------------
vi.mock("next/headers", async () => {
  const { cookieStore } = await import("./helpers/cookieStore");
  return {
    cookies: () => ({
      get: (name: string) =>
        cookieStore.current[name] !== undefined
          ? { name, value: cookieStore.current[name] }
          : undefined,
      set: (
        name: string,
        value: string,
        options?: Record<string, unknown>
      ) => {
        cookieStore.current[name] = value;
        if (options) {
          cookieStore.options[name] = options as {
            httpOnly?: boolean;
            secure?: boolean;
            sameSite?: string;
            path?: string;
          };
        }
      },
      delete: (name: string) => {
        delete cookieStore.current[name];
        delete cookieStore.options[name];
      },
      getAll: () =>
        Object.entries(cookieStore.current).map(([name, value]) => ({
          name,
          value,
        })),
    }),
  };
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`) as Error & {
      digest: string;
    };
    error.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  },
  notFound: () => {
    const error = new Error("NEXT_NOT_FOUND") as Error & { digest: string };
    error.digest = "NEXT_NOT_FOUND";
    throw error;
  },
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));
