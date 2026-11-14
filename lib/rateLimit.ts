import { db } from "@/lib/db";

/**
 * Login rate limiting.
 *
 * The counters live in the database (LoginAttempt) instead of an in-memory
 * map: on serverless (Vercel) every request can land on a different
 * instance, so an in-memory limiter would be reset constantly and would not
 * protect anything.
 *
 * Rule (unchanged): 5 failed attempts per IP within 15 minutes. The 6th
 * attempt inside the window is rejected with HTTP 429.
 */

/** Length of the attempt window. */
const WINDOW_MS = 15 * 60 * 1000;

/** How long a key stays locked once it reached the limit. */
const LOCK_MS = 15 * 60 * 1000;

/** Failed attempts allowed inside the window. */
const MAX_ATTEMPTS = 5;

/** Rows older than this are removed on the next failed attempt. */
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;

/** True when the key is currently locked out. */
export async function isRateLimited(key: string): Promise<boolean> {
  const row = await db.loginAttempt.findUnique({ where: { key } });
  if (!row) return false;
  if (row.lockedUntil && row.lockedUntil.getTime() > Date.now()) return true;
  return false;
}

/**
 * Record a failed login attempt.
 *
 * Returns true when this attempt reached the limit (the caller should
 * answer with HTTP 429).
 */
export async function recordFailedAttempt(key: string): Promise<boolean> {
  const now = new Date();
  const row = await db.loginAttempt.findUnique({ where: { key } });

  // Start a fresh window when the previous one has expired.
  if (!row || now.getTime() - row.firstAttemptAt.getTime() > WINDOW_MS) {
    await db.loginAttempt.upsert({
      where: { key },
      create: { key, count: 1, firstAttemptAt: now, lockedUntil: null },
      update: { count: 1, firstAttemptAt: now, lockedUntil: null },
    });
    await cleanupOldRows();
    return false;
  }

  const count = row.count + 1;
  // The first MAX_ATTEMPTS failures are answered with 401; the attempt
  // that exceeds the limit is rejected with 429 and locks the key.
  const locked = count > MAX_ATTEMPTS;
  const lockedUntil = locked ? new Date(now.getTime() + LOCK_MS) : null;

  await db.loginAttempt.update({
    where: { key },
    data: { count, lockedUntil },
  });

  return locked;
}

/**
 * Clear the counter for a key — called after a successful login so a user
 * who mistyped their password once is not punished afterwards.
 */
export async function resetLoginAttempts(key: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { key } });
}

/** Remove rows that can no longer block anything. */
async function cleanupOldRows(): Promise<void> {
  const cutoff = new Date(Date.now() - CLEANUP_AGE_MS);
  try {
    await db.loginAttempt.deleteMany({
      where: {
        OR: [{ firstAttemptAt: { lt: cutoff } }, { lockedUntil: { lt: cutoff } }],
      },
    });
  } catch {
    // Housekeeping must never break a login.
  }
}
