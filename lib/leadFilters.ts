/**
 * Shared lead-list filter helpers.
 *
 * These live outside the "use server" action files because a "use server"
 * module may only export async functions.
 */

/**
 * Turn a status filter into a Prisma filter.
 *
 * A single status is used as-is; several statuses can be given as a
 * comma-separated list (e.g. "NEW_LEAD,NOT_RESPONDING", which is how the
 * "Leads Awaiting Action" notification links to the lead list).
 */
export function statusFilter(status: string): string | { in: string[] } {
  const list = status
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 1 ? { in: list } : list[0] ?? status;
}
