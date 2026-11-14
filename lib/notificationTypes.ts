/**
 * Shared notification types.
 *
 * This module deliberately contains NO database / server-only imports so it
 * can be imported from server components, client components and route
 * handlers alike.
 */

/** Which side of the app a notification feed belongs to. */
export type NotificationScope = "client" | "admin";

/**
 * Notification types.
 *
 * - NEW_LEAD / LEAD_CONVERTED are *stored* events: they are rows in the
 *   Notification table so they can be read/unread and kept as history.
 * - FOLLOWUP_DUE / OVERDUE_FOLLOWUP / AWAITING_ACTION are *live* items: they
 *   are computed from the leads table on every request, never stored, so they
 *   can never go stale.
 */
export const NOTIFICATION_TYPE = {
  NEW_LEAD: "NEW_LEAD",
  FOLLOWUP_DUE: "FOLLOWUP_DUE",
  OVERDUE_FOLLOWUP: "OVERDUE_FOLLOWUP",
  AWAITING_ACTION: "AWAITING_ACTION",
  LEAD_CONVERTED: "LEAD_CONVERTED",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/**
 * Lead statuses that still need a human to do something. Used for the
 * "Leads Awaiting Action" live notification.
 */
export const AWAITING_ACTION_STATUSES = ["NEW_LEAD", "NOT_RESPONDING"] as const;

/** A single lead inside a live notification group. */
export interface LiveNotificationLead {
  id: string;
  leadCode: string;
  name: string;
  /** Friendly status label (e.g. "New Lead"). */
  status: string;
  /** ISO timestamp of the scheduled follow-up, if any. */
  nextFollowUpDate: string | null;
  /** Owning client (only populated for the admin scope). */
  clientName: string | null;
  /** Link to the lead inside the current scope. */
  href: string;
}

/** A live notification category (due today / overdue / awaiting action). */
export interface LiveNotificationGroup {
  type: string;
  title: string;
  /** Number of matching leads (not the number of rows shown). */
  count: number;
  /** Link to the page listing every lead in this category. */
  href: string;
  /** The matching leads (capped). */
  leads: LiveNotificationLead[];
}

/** A stored notification row, flattened for the UI. */
export interface StoredNotification {
  id: string;
  type: string;
  /** Friendly label for `type`. */
  typeLabel: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  /** ISO timestamp. */
  createdAt: string;
}

/** Everything the bell dropdown and the notifications pages render. */
export interface NotificationFeed {
  scope: NotificationScope;
  /** Stored notifications that have not been read yet. */
  unread: number;
  /** Live items (due today + overdue + awaiting action). */
  liveTotal: number;
  /** Badge count = unread + liveTotal. */
  count: number;
  groups: LiveNotificationGroup[];
  notifications: StoredNotification[];
}
