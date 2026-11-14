import { requireAdmin } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/notifications";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";

export const dynamic = "force-dynamic";

/**
 * Admin notifications page.
 *
 * Admin notifications are the rows with clientId = null; the live groups are
 * computed across every client.
 */
export default async function AdminNotificationsPage() {
  await requireAdmin();

  const feed = await getNotificationFeed("admin", null, {
    limit: 50,
    groupLimit: 25,
  });

  return <NotificationsPanel feed={feed} scope="admin" />;
}
