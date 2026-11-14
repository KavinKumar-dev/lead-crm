import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration.
 *
 * The tests run against a SEPARATE SQLite database (prisma/test.db). The
 * development database (prisma/dev.db) is never used — see
 * tests/global-setup.ts, which also asserts that dev.db is untouched.
 */
export default defineConfig({
  // The app uses the automatic JSX runtime (Next.js default).
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    // The tests share one SQLite file, so they must not run concurrently.
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      // The database URL is swapped for TEST_DATABASE_URL in tests/setup.ts
      // (before the Prisma client is created). DATABASE_URL itself is never
      // used by the tests.
      SESSION_SECRET: "test-only-session-secret-do-not-use-in-production-0123456789",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
