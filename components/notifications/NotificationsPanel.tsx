import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  UserX,
  BellRing,
  CheckCheck,
  Inbox,
  ChevronRight,
} from "lucide-react";
import MarkAllReadButton from "./MarkAllReadButton";
import type {
  LiveNotificationGroup,
  NotificationFeed,
  NotificationScope,
  StoredNotification,
} from "@/lib/notificationTypes";

function iconForType(type: string) {
  switch (type) {
    case "OVERDUE_FOLLOWUP":
      return AlertTriangle;
    case "FOLLOWUP_DUE":
      return CalendarClock;
    case "AWAITING_ACTION":
      return UserX;
    case "NEW_LEAD":
      return BellRing;
    case "LEAD_CONVERTED":
      return CheckCheck;
    default:
      return Inbox;
  }
}

function iconColorForType(type: string): string {
  switch (type) {
    case "OVERDUE_FOLLOWUP":
      return "text-red-600 bg-red-50";
    case "FOLLOWUP_DUE":
      return "text-amber-600 bg-amber-50";
    case "AWAITING_ACTION":
      return "text-blue-600 bg-blue-50";
    case "NEW_LEAD":
      return "text-green-600 bg-green-50";
    case "LEAD_CONVERTED":
      return "text-emerald-600 bg-emerald-50";
    default:
      return "text-gray-500 bg-gray-100";
  }
}

/**
 * Full notifications page body — live groups on top, stored notifications
 * (new lead / conversion) underneath.
 */
export default function NotificationsPanel({
  feed,
  scope,
}: {
  feed: NotificationFeed;
  scope: NotificationScope;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            {feed.liveTotal} item{feed.liveTotal === 1 ? "" : "s"} need attention
            {feed.unread > 0 ? ` · ${feed.unread} unread` : " · all read"}
          </p>
        </div>
        <MarkAllReadButton scope={scope} disabled={feed.unread === 0} />
      </div>

      {/* ===== Live groups (computed from the leads table) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {feed.groups.map((group) => (
          <LiveGroupCard key={group.type} group={group} />
        ))}
      </div>

      {/* ===== Stored notifications (new lead / converted) ===== */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent activity
        </h2>
        {feed.notifications.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
            No notifications yet. New leads and conversions will show up here.
          </div>
        ) : (
          <ul className="bg-white border rounded-xl divide-y overflow-hidden">
            {feed.notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Card for one live category (due today / overdue / awaiting action). */
function LiveGroupCard({ group }: { group: LiveNotificationGroup }) {
  const Icon = iconForType(group.type);

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden flex flex-col ${
        group.count === 0 ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconColorForType(
              group.type
            )}`}
          >
            <Icon size={16} />
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {group.title}
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
          {group.count}
        </span>
      </div>

      {group.leads.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">Nothing here right now.</p>
      ) : (
        <ul className="divide-y flex-1">
          {group.leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={lead.href}
                className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-gray-900 truncate">
                    {lead.name}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {lead.leadCode} · {lead.status}
                    {lead.clientName ? ` · ${lead.clientName}` : ""}
                  </span>
                </span>
                {lead.nextFollowUpDate && (
                  <span className="shrink-0 text-xs text-gray-500">
                    {format(new Date(lead.nextFollowUpDate), "d MMM yyyy")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {group.count > 0 && (
        <div className="border-t">
          <Link
            href={group.href}
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            View all {group.count}
            <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

/** A stored notification row. */
function NotificationRow({ notification }: { notification: StoredNotification }) {
  const Icon = iconForType(notification.type);

  const body = (
    <span className="flex items-start gap-3">
      <span
        className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${iconColorForType(
          notification.type
        )}`}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {notification.title}
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {notification.typeLabel}
          </span>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </span>
        <span className="block text-sm text-gray-600">{notification.message}</span>
        <span className="block text-xs text-gray-400">
          {format(new Date(notification.createdAt), "d MMM yyyy, h:mm a")}
        </span>
      </span>
    </span>
  );

  const className = `block px-4 py-3 transition-colors ${
    notification.isRead ? "hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50/70"
  }`;

  return (
    <li>
      {notification.link ? (
        <Link href={notification.link} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}
