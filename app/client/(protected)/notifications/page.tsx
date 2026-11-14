import { requireClient } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/notifications";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";

export const dynamic = "force-dynamic";

/**
 * Client notifications page.
 *
 * SECURITY: the client scope comes only from the session (session.id is the
 * clientId) — it is never taken from the URL or the request.
 */
export default async function ClientNotificationsPage() {
  const session = await requireClient();

  const feed = await getNotificationFeed("client", session.id, {
    limit: 50,
    groupLimit: 25,
  });

  return <NotificationsPanel feed={feed} scope="client" />;
}
