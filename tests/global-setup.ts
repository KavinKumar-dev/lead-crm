import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Global test setup.
 *
 * Creates a FRESH SQLite database for the tests (prisma/test.db) and makes
 * sure the development database (prisma/dev.db) is never touched.
 *
 * "file:./test.db" is resolved by Prisma relative to the schema file
 * (prisma/schema.prisma), so it lands in prisma/test.db.
 */
const ROOT = process.cwd();
const PRISMA_DIR = path.join(ROOT, "prisma");
const TEST_DB = path.join(PRISMA_DIR, "test.db");
const DEV_DB = path.join(PRISMA_DIR, "dev.db");

function fileSignature(file: string) {
  if (!fs.existsSync(file)) return "missing";
  const stat = fs.statSync(file);
  return `${stat.size}:${stat.mtimeMs}`;
}

export default function setup() {
  process.env.DATABASE_URL = "file:./test.db";

  // Guard: the test database must never be the development database.
  if (!process.env.DATABASE_URL.includes("test.db")) {
    throw new Error(
      `Refusing to run tests with DATABASE_URL="${process.env.DATABASE_URL}" — the test database must be a separate file.`
    );
  }

  const devBefore = fileSignature(DEV_DB);

  // Start from a clean database every run.
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = `${TEST_DB}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  // Create the schema in the test database only.
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });

  if (!fs.existsSync(TEST_DB)) {
    throw new Error("The test database was not created.");
  }

  return async () => {
    const devAfter = fileSignature(DEV_DB);
    if (devBefore !== devAfter) {
      throw new Error(
        `The development database was modified during the test run (${devBefore} -> ${devAfter}).`
      );
    }
  };
}
