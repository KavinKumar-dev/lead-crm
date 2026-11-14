import { execSync } from "child_process";
import dotenv from "dotenv";

/**
 * Global test setup.
 *
 * Creates the schema in the dedicated TEST database (TEST_DATABASE_URL) and
 * makes sure the production database (DATABASE_URL) is never touched.
 */
dotenv.config();

const ROOT = process.cwd();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. The tests must run against a separate database — ` +
        `set ${name} to a throwaway PostgreSQL database.`
    );
  }
  return value;
}

export default function setup() {
  const testDatabaseUrl = required("TEST_DATABASE_URL");
  const appDatabaseUrl = process.env.DATABASE_URL?.trim();

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

  // Sync the schema into the TEST database only.
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: ROOT,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
    },
    stdio: "inherit",
  });
}
