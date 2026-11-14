import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  getNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["read", "read-all"]),
  id: z.string().min(1).optional(),
});

/**
 * GET /api/notifications/admin — notification feed for the administrator.
 *
 * Admin notifications are the rows with clientId = null, and the live groups
 * are computed across every client.
 */
export async function GET() {
  // Outside try/catch: the auth redirect must be able to propagate.
  await requireAdmin();

  const feed = await getNotificationFeed("admin", null);
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * POST /api/notifications/admin — mark admin notifications as read.
 *
 * Body: { action: "read", id } or { action: "read-all" }.
 */
export async function POST(request: Request) {
  await requireAdmin();

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { action, id } = parsed.data;

  if (action === "read") {
    if (!id) {
      return NextResponse.json(
        { error: "Notification id is required." },
        { status: 400 }
      );
    }
    // Admin rows are the ones with clientId = null.
    const updated = await markNotificationRead("admin", null, id);
    return NextResponse.json({ success: true, updated });
  }

  const updated = await markAllNotificationsRead("admin", null);
  return NextResponse.json({ success: true, updated });
}
