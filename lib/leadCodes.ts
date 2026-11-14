import { db } from "@/lib/db";

/**
 * Lead code generation.
 *
 * A lead code is the identifier a client sees on their own leads, e.g.
 * "LD-11111-001".
 *
 * SECURITY: the sequence is scoped to the client. A global counter (the
 * obvious implementation) leaks how many leads the whole CRM holds: a client
 * reading "LD-00417" on their third lead could work out the total number of
 * leads across every client. The client code is part of the identifier
 * instead, which keeps the code unique across the system while revealing
 * nothing but the client's own data.
 */
export async function generateLeadCode(
  clientId: string,
  clientCode: string
): Promise<string> {
  const count = await db.lead.count({ where: { clientId } });
  return `LD-${clientCode}-${(count + 1).toString().padStart(3, "0")}`;
}

/**
 * True for a Prisma "unique constraint failed" error (P2002).
 *
 * Two leads created at the same moment can pick the same sequence number, so
 * callers retry with a fresh code instead of failing the request.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
