"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  UserX,
  Inbox,
  Loader2,
} from "lucide-react";
import type {
  LiveNotificationGroup,
  NotificationFeed,
  NotificationScope,
  StoredNotification,
} from "@/lib/notificationTypes";

/** Endpoint that serves the feed for the given scope. */
function endpointFor(scope: NotificationScope): string {
  return scope === "admin"
    ? "/api/notifications/admin"
    : "/api/notifications/client";
}

/** Link to the full notifications page for the given scope. */
function pageHrefFor(scope: NotificationScope): string {
  return scope === "admin" ? "/admin/notifications" : "/client/notifications";
}

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
 * Notification bell with a dropdown of recent notifications.
 *
 * The badge count is refreshed when the page loads and every 60 seconds.
 */
export default function NotificationBell({ scope }: { scope: NotificationScope }) {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const endpoint = endpointFor(scope);
  const allHref = pageHrefFor(scope);

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const res = await fetch(endpoint, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        // An expired session redirects to the login page (HTML) — ignore it.
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = (await res.json()) as NotificationFeed;
        setFeed(data);
      } catch {
        // Network hiccup — keep the last known count.
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [endpoint]
  );

  // Load once on mount, then refresh every 60 seconds.
  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const post = useCallback(
    async (body: { action: string; id?: string }) => {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        // Ignore — the refresh below shows the real state.
      }
    },
    [endpoint]
  );

  const markAllRead = async () => {
    await post({ action: "read-all" });
    load();
  };

  const markOneRead = async (id: string) => {
    await post({ action: "read", id });
    load();
  };

  const count = feed?.count ?? 0;
  const unread = feed?.unread ?? 0;
  const groups = feed?.groups ?? [];
  const notifications = feed?.notifications ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load(true);
        }}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications (${count} needing attention)`}
        aria-expanded={open}
      >
        {loading ? (
          <Loader2 size={22} className="animate-spin text-gray-400" />
        ) : (
          <Bell size={22} className={count > 0 ? "text-gray-800" : "text-gray-500"} />
        )}
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b">
            <div>
              <p className="font-semibold text-sm text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">
                {count} item{count === 1 ? "" : "s"} needing attention
                {unread > 0 ? ` · ${unread} unread` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[26rem] overflow-y-auto divide-y divide-gray-100">
            {groups.map((group) => (
              <GroupSection key={group.type} group={group} />
            ))}

            {notifications.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Recent activity
                </p>
                <ul>
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onRead={markOneRead}
                    />
                  ))}
                </ul>
              </div>
            )}

            {groups.every((g) => g.count === 0) &&
              notifications.length === 0 && (
                <p className="p-6 text-sm text-gray-500 text-center">
                  Nothing needs your attention right now.
                </p>
              )}
          </div>

          {/* Footer */}
          <div className="border-t p-2">
            <Link
              href={allHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg py-2 transition-colors"
            >
              View all notifications
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** A live group (due today / overdue / awaiting action) with its leads. */
function GroupSection({ group }: { group: LiveNotificationGroup }) {
  const Icon = iconForType(group.type);

  return (
    <div className={group.count === 0 ? "opacity-60" : ""}>
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${iconColorForType(
              group.type
            )}`}
          >
            <Icon size={15} />
          </span>
          <span className="text-sm font-medium text-gray-800 truncate">
            {group.title}
          </span>
        </div>
        <span className="shrink-0 text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
          {group.count}
        </span>
      </div>

      {group.leads.length > 0 && (
        <ul className="pb-1">
          {group.leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={lead.href}
                className="flex items-center justify-between gap-2 pl-12 pr-4 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700 truncate">
                  {lead.name}{" "}
                  <span className="font-mono text-[11px] text-gray-400">
                    {lead.leadCode}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {lead.nextFollowUpDate
                    ? format(new Date(lead.nextFollowUpDate), "d MMM")
                    : lead.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {group.count > 0 && (
        <div className="pl-12 pr-4 pb-2">
          <Link
            href={group.href}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all {group.count}
          </Link>
        </div>
      )}
    </div>
  );
}

/** A stored notification row (new lead, conversion). */
function NotificationRow({
  notification,
  onRead,
}: {
  notification: StoredNotification;
  onRead: (id: string) => void;
}) {
  const Icon = iconForType(notification.type);

  const inner = (
    <span className="flex items-start gap-2">
      <span
        className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${iconColorForType(
          notification.type
        )}`}
      >
        <Icon size={13} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {notification.title}
          </span>
          {!notification.isRead && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </span>
        <span className="block text-xs text-gray-500 truncate">
          {notification.message}
        </span>
        <span className="block text-[11px] text-gray-400">
          {format(new Date(notification.createdAt), "d MMM yyyy, h:mm a")}
        </span>
      </span>
    </span>
  );

  return (
    <li>
      {notification.link ? (
        <Link
          href={notification.link}
          onClick={() => {
            if (!notification.isRead) onRead(notification.id);
          }}
          className={`block px-4 py-2.5 hover:bg-gray-50 transition-colors ${
            notification.isRead ? "" : "bg-blue-50/40"
          }`}
        >
          {inner}
        </Link>
      ) : (
        <div
          onClick={() => {
            if (!notification.isRead) onRead(notification.id);
          }}
          className={`block px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
            notification.isRead ? "" : "bg-blue-50/40"
          }`}
        >
          {inner}
        </div>
      )}
    </li>
  );
}
