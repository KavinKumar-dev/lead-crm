/**
 * Notification system (Phase 9B).
 *
 * Two kinds of notification live side by side:
 *
 *  - STORED events — "new lead uploaded" and "lead converted". These are rows
 *    in the Notification table so they can be marked read/unread and kept as
 *    a history. A row with `clientId` set belongs to that client; a row with
 *    `clientId = null` belongs to the admin.
 *
 *  - LIVE items — "follow-ups due today", "overdue follow-ups" and "leads
 *    awaiting action". These are computed from the leads table on every
 *    request, so they are never stale and never need to be cleaned up.
 *
 * SECURITY: every function takes the scope explicitly. The client scope is
 * always resolved from the session (see requireClient), never from the
 * request body. `clientId` is therefore never an input we trust.
 */

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getDateRange } from "@/lib/dateRange";
import {
  leadSourceLabel,
  leadStatusLabel,
  notificationTypeLabel,
} from "@/lib/labels";
import { TERMINAL_STATUSES } from "@/lib/dashboardStats";
import {
  AWAITING_ACTION_STATUSES,
  LiveNotificationGroup,
  LiveNotificationLead,
  NOTIFICATION_TYPE,
  NotificationFeed,
  NotificationScope,
  StoredNotification,
} from "@/lib/notificationTypes";

export * from "@/lib/notificationTypes";

/** Only the `notification` delegate is needed, so both PrismaClient and an
 * interactive transaction client can be passed in. */
type NotificationStore = Pick<Prisma.TransactionClient, "notification">;

/** Only the `client` delegate is needed, for the same reason. */
type ClientStore = Pick<Prisma.TransactionClient, "client">;

const LEAD_INCLUDE = { client: { select: { clientName: true } } };

/** Where clause for the leads table, restricted to the caller. */
function leadScope(scope: NotificationScope, clientId: string | null) {
  // A client scope always has a clientId; the fallback can never match a row.
  return scope === "client" ? { clientId: clientId ?? "__no_client__" } : {};
}

/** Where clause for the Notification table, restricted to the caller. */
function notificationScope(scope: NotificationScope, clientId: string | null) {
  return scope === "client"
    ? { clientId: clientId ?? "__no_client__" }
    : { clientId: null };
}

/** Link to the lead list/detail pages for the current scope. */
function leadHrefBase(scope: NotificationScope): string {
  return scope === "admin" ? "/admin/leads" : "/client/leads";
}

/**
 * Live notification groups computed straight from the leads table.
 *
 * - Follow-ups due today: next follow-up falls on today (IST).
 * - Overdue follow-ups: next follow-up is before today.
 * - Leads awaiting action: status is New Lead or Not Responding.
 *
 * Converted / Lost leads are always excluded from the follow-up groups.
 */
export async function getLiveNotificationGroups(
  scope: NotificationScope,
  clientId: string | null,
  opts: { limit?: number } = {}
): Promise<LiveNotificationGroup[]> {
  const limit = Math.max(1, opts.limit ?? 5);
  const scopeWhere = leadScope(scope, clientId);
  const today = getDateRange("today");

  const dueWhere = {
    ...scopeWhere,
    status: { notIn: TERMINAL_STATUSES },
    nextFollowUpDate: { gte: today.start, lte: today.end },
  };
  const overdueWhere = {
    ...scopeWhere,
    status: { notIn: TERMINAL_STATUSES },
    nextFollowUpDate: { lt: today.start },
  };
  const awaitingWhere = {
    ...scopeWhere,
    status: { in: [...AWAITING_ACTION_STATUSES] },
  };

  const [
    dueLeads,
    dueCount,
    overdueLeads,
    overdueCount,
    awaitingLeads,
    awaitingCount,
  ] = await Promise.all([
    db.lead.findMany({
      where: dueWhere,
      orderBy: { nextFollowUpDate: "asc" },
      take: limit,
      include: LEAD_INCLUDE,
    }),
    db.lead.count({ where: dueWhere }),
    db.lead.findMany({
      where: overdueWhere,
      orderBy: { nextFollowUpDate: "asc" },
      take: limit,
      include: LEAD_INCLUDE,
    }),
    db.lead.count({ where: overdueWhere }),
    db.lead.findMany({
      where: awaitingWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: LEAD_INCLUDE,
    }),
    db.lead.count({ where: awaitingWhere }),
  ]);

  const base = leadHrefBase(scope);

  const toLead = (l: {
    id: string;
    leadCode: string;
    name: string;
    status: string;
    nextFollowUpDate: Date | null;
    client?: { clientName: string } | null;
  }): LiveNotificationLead => ({
    id: l.id,
    leadCode: l.leadCode,
    name: l.name,
    status: leadStatusLabel(l.status),
    nextFollowUpDate: l.nextFollowUpDate ? l.nextFollowUpDate.toISOString() : null,
    clientName: l.client?.clientName ?? null,
    href: `${base}/${l.id}`,
  });

  return [
    {
      type: NOTIFICATION_TYPE.OVERDUE_FOLLOWUP,
      title: notificationTypeLabel(NOTIFICATION_TYPE.OVERDUE_FOLLOWUP),
      count: overdueCount,
      href:
        scope === "admin"
          ? "/admin/leads?followUp=overdue"
          : "/client/follow-ups?filter=overdue",
      leads: overdueLeads.map(toLead),
    },
    {
      type: NOTIFICATION_TYPE.FOLLOWUP_DUE,
      title: notificationTypeLabel(NOTIFICATION_TYPE.FOLLOWUP_DUE),
      count: dueCount,
      href:
        scope === "admin"
          ? "/admin/leads?followUp=due"
          : "/client/follow-ups?filter=due",
      leads: dueLeads.map(toLead),
    },
    {
      type: NOTIFICATION_TYPE.AWAITING_ACTION,
      title: notificationTypeLabel(NOTIFICATION_TYPE.AWAITING_ACTION),
      count: awaitingCount,
      href: `${base}?status=NEW_LEAD,NOT_RESPONDING`,
      leads: awaitingLeads.map(toLead),
    },
  ];
}

/** Recent stored notifications for the current scope. */
export async function getStoredNotifications(
  scope: NotificationScope,
  clientId: string | null,
  limit = 20
): Promise<StoredNotification[]> {
  const rows = await db.notification.findMany({
    where: notificationScope(scope, clientId),
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    typeLabel: notificationTypeLabel(n.type),
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

/** Number of stored notifications that have not been read yet. */
export async function countUnreadNotifications(
  scope: NotificationScope,
  clientId: string | null
): Promise<number> {
  return db.notification.count({
    where: { ...notificationScope(scope, clientId), isRead: false },
  });
}

/**
 * The full notification feed for the current scope: live groups + stored
 * notifications + the badge count.
 */
export async function getNotificationFeed(
  scope: NotificationScope,
  clientId: string | null,
  opts: { limit?: number; groupLimit?: number } = {}
): Promise<NotificationFeed> {
  const [groups, notifications, unread] = await Promise.all([
    getLiveNotificationGroups(scope, clientId, { limit: opts.groupLimit ?? 5 }),
    getStoredNotifications(scope, clientId, opts.limit ?? 20),
    countUnreadNotifications(scope, clientId),
  ]);

  const liveTotal = groups.reduce((sum, g) => sum + g.count, 0);

  return {
    scope,
    unread,
    liveTotal,
    count: unread + liveTotal,
    groups,
    notifications,
  };
}

/**
 * Mark a single stored notification as read.
 *
 * The id is matched together with the scope filter, so a client can never
 * mark another client's notification as read (the update simply matches 0
 * rows).
 */
export async function markNotificationRead(
  scope: NotificationScope,
  clientId: string | null,
  id: string
): Promise<number> {
  const result = await db.notification.updateMany({
    where: { ...notificationScope(scope, clientId), id },
    data: { isRead: true },
  });
  return result.count;
}

/** Mark every stored notification of the current scope as read. */
export async function markAllNotificationsRead(
  scope: NotificationScope,
  clientId: string | null
): Promise<number> {
  const result = await db.notification.updateMany({
    where: { ...notificationScope(scope, clientId), isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

/**
 * Identity of a client account (used to label admin notifications).
 *
 * The store is passed in so the lookup can run inside the caller's
 * transaction — a second connection is not opened while a write transaction
 * is active.
 */
export async function getClientIdentity(store: ClientStore, clientId: string) {
  return store.client.findUnique({
    where: { id: clientId },
    select: { id: true, clientCode: true, clientName: true },
  });
}

/**
 * Store the "new lead uploaded" notifications.
 *
 * Two rows are written for every event:
 *  - one for the client that owns the lead (clientId set), linking to the
 *    client lead page;
 *  - one for the admin (clientId null), linking to the admin lead page.
 *
 * A single lead produces a lead-specific notification; a bulk import
 * produces one summary notification per side so the bell is not flooded.
 */
export async function notifyNewLeads(
  store: NotificationStore,
  params: {
    clientId: string;
    clientCode: string;
    clientName: string;
    leads: { id: string; leadCode: string; name: string; source: string }[];
  }
): Promise<void> {
  const { clientId, clientCode, clientName, leads } = params;
  if (leads.length === 0) return;

  if (leads.length === 1) {
    const lead = leads[0];
    const sourceLabel = leadSourceLabel(lead.source);

    await store.notification.create({
      data: {
        clientId,
        type: NOTIFICATION_TYPE.NEW_LEAD,
        title: `New lead added: ${lead.name}`,
        message: `${lead.leadCode} · Source: ${sourceLabel}`,
        link: `/client/leads/${lead.id}`,
      },
    });
    await store.notification.create({
      data: {
        clientId: null,
        type: NOTIFICATION_TYPE.NEW_LEAD,
        title: `New lead uploaded by ${clientName}`,
        message: `${lead.name} (${lead.leadCode}) · Source: ${sourceLabel}`,
        link: `/admin/leads/${lead.id}`,
      },
    });
    return;
  }

  const count = leads.length;
  await store.notification.create({
    data: {
      clientId,
      type: NOTIFICATION_TYPE.NEW_LEAD,
      title: `${count} new leads uploaded`,
      message: `${count} leads were added to your pipeline.`,
      link: "/client/leads",
    },
  });
  await store.notification.create({
    data: {
      clientId: null,
      type: NOTIFICATION_TYPE.NEW_LEAD,
      title: `${count} leads uploaded by ${clientName}`,
      message: `${count} leads were added by client ${clientCode}.`,
      link: `/admin/leads?client=${clientCode}`,
    },
  });
}

/**
 * Store the "lead converted" notifications (one for the client, one for the
 * admin).
 */
export async function notifyLeadConverted(
  store: NotificationStore,
  params: {
    clientId: string;
    clientCode: string;
    clientName: string;
    leadId: string;
    leadCode: string;
    leadName: string;
    productService?: string | null;
  }
): Promise<void> {
  const { clientId, clientCode, clientName, leadId, leadCode, leadName } = params;
  const statusLabel = leadStatusLabel("CONVERTED");
  const detail = params.productService ? ` · ${params.productService}` : "";

  await store.notification.create({
    data: {
      clientId,
      type: NOTIFICATION_TYPE.LEAD_CONVERTED,
      title: `Lead converted: ${leadName}`,
      message: `${leadCode} is now ${statusLabel}${detail}`,
      link: `/client/leads/${leadId}`,
    },
  });
  await store.notification.create({
    data: {
      clientId: null,
      type: NOTIFICATION_TYPE.LEAD_CONVERTED,
      title: `Lead converted by ${clientName}`,
      message: `${leadName} (${leadCode}) is now ${statusLabel}${detail} · Client ${clientCode}`,
      link: `/admin/leads/${leadId}`,
    },
  });
}
