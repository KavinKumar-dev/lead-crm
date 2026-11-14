import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
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
 * GET /api/notifications/client — notification feed for the logged-in client.
 *
 * SECURITY: the client scope comes ONLY from the session cookie. There is
 * deliberately no clientId parameter — a client can never read or mark
 * another client's notifications.
 */
export async function GET() {
  // Outside try/catch: the auth redirect must be able to propagate.
  const session = await requireClient();

  const feed = await getNotificationFeed("client", session.id);
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * POST /api/notifications/client — mark notifications as read.
 *
 * Body: { action: "read", id } or { action: "read-all" }.
 *
 * SECURITY: the id is matched together with the session's clientId, so a
 * client can never touch another client's notifications.
 */
export async function POST(request: Request) {
  const session = await requireClient();

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
    const updated = await markNotificationRead("client", session.id, id);
    return NextResponse.json({ success: true, updated });
  }

  const updated = await markAllNotificationsRead("client", session.id);
  return NextResponse.json({ success: true, updated });
}
