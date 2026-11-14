import { vi } from "vitest";
import dotenv from "dotenv";

/**
 * Vitest setup — runs before every test file.
 *
 * 1. Points the Prisma client at the dedicated TEST database. This must
 *    happen BEFORE any module that imports lib/db.ts is evaluated. The
 *    production DATABASE_URL is never used by the tests.
 * 2. Mocks the Next.js request scoped APIs the server actions rely on
 *    (cookies, redirect, notFound, revalidatePath) so they can be exercised
 *    outside of a running Next.js server.
 */

// --- 1. Test database -------------------------------------------------
// Load .env so TEST_DATABASE_URL can be provided there. Existing process
// variables always win.
dotenv.config();

// The original DATABASE_URL is captured once per worker process. The setup
// file runs before every test file, so without this the second file would
// compare the (already swapped) TEST url against itself.
interface TestDbState {
  originalDatabaseUrl: string | undefined;
  applied: boolean;
}

const globalScope = globalThis as unknown as { __testDbState?: TestDbState };
const state: TestDbState =
  globalScope.__testDbState ??
  (globalScope.__testDbState = {
    originalDatabaseUrl: process.env.DATABASE_URL,
    applied: false,
  });

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const appDatabaseUrl = state.originalDatabaseUrl?.trim();

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. The tests must run against a separate database — " +
      "set TEST_DATABASE_URL to a throwaway PostgreSQL database."
  );
}

if (testDatabaseUrl === appDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must not be the same as DATABASE_URL — the tests would " +
      "truncate the real database."
  );
}

if (!/^postgres(ql)?:\/\//i.test(testDatabaseUrl)) {
  throw new Error(
    `TEST_DATABASE_URL must be a PostgreSQL connection string (got "${testDatabaseUrl}").`
  );
}

// The application code under test reads DATABASE_URL — point it at the
// test database. DIRECT_URL is used by Prisma for schema operations.
if (!state.applied) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DIRECT_URL = testDatabaseUrl;
  state.applied = true;
}

process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "test-only-session-secret-do-not-use-in-production-0123456789";

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
