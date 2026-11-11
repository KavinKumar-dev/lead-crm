const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  if (now - attempt.firstAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  if (attempt.count >= 5) return true;

  attempt.count += 1;
  return false;
}
