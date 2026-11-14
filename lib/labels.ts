/**
 * Shared friendly-label maps for every enum-style value stored in the
 * database (status, stage, source, ...).
 *
 * The database keeps stable UPPER_SNAKE_CASE values; the UI and the reports
 * always show the friendly label defined here.
 */

/** Lead status values (matches LEAD_STATUS in lib/constants.ts). */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  NOT_RESPONDING: "Not Responding",
  FOLLOW_UP_REQUIRED: "Follow-Up Required",
  CONVERTED: "Converted",
  LOST: "Lost",
};

/** Follow-up stage values (matches FOLLOW_UP_STAGE in lib/constants.ts). */
export const FOLLOW_UP_STAGE_LABELS: Record<string, string> = {
  INITIAL_CONTACT: "Initial Contact",
  FOLLOW_UP_1: "Follow-Up 1",
  FOLLOW_UP_2: "Follow-Up 2",
  FOLLOW_UP_3: "Follow-Up 3",
};

/** Lead source values (matches LEAD_SOURCE in lib/constants.ts). */
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  OTHER: "Other",
};

/** Client account status values (matches CLIENT_STATUS in lib/constants.ts). */
export const CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

/** User role values (matches USER_ROLE in lib/constants.ts). */
export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  CLIENT: "Client",
};

/**
 * Notification type values (matches NOTIFICATION_TYPE in
 * lib/notificationTypes.ts).
 */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead Uploaded",
  FOLLOWUP_DUE: "Follow-Ups Due Today",
  OVERDUE_FOLLOWUP: "Overdue Follow-Ups",
  AWAITING_ACTION: "Leads Awaiting Action",
  LEAD_CONVERTED: "Lead Converted",
};

/**
 * Event shown in the Follow-Up report timeline. A follow-up record is either
 * a regular follow-up, or the automatic record created when a lead is
 * converted or marked lost.
 */
export const FOLLOW_UP_EVENT_LABELS: Record<string, string> = {
  FOLLOW_UP: "Follow-Up",
  CONVERTED: "Converted",
  LOST: "Lost",
};

/**
 * Turn an unknown UPPER_SNAKE_CASE value into a readable label.
 * Used as a fallback so a new enum value is never shown raw.
 */
export function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Look up a label, falling back to a humanized version of the value.
 *
 * The lookup is case-insensitive so a value stored as "whatsapp" or
 * "WhatsApp" (e.g. imported from a CSV) still resolves to the canonical
 * "WhatsApp" label instead of falling back to a generic humanized value.
 */
export function labelOf(
  labels: Record<string, string>,
  value: string | null | undefined
): string {
  if (!value) return "";
  const direct = labels[value];
  if (direct !== undefined) return direct;

  const needle = value.trim().toUpperCase();
  for (const key of Object.keys(labels)) {
    if (key.toUpperCase() === needle) return labels[key];
  }

  return humanize(value);
}

/** Friendly label for a lead status. */
export function leadStatusLabel(value: string | null | undefined): string {
  return labelOf(LEAD_STATUS_LABELS, value);
}

/** Friendly label for a follow-up stage. */
export function followUpStageLabel(value: string | null | undefined): string {
  return labelOf(FOLLOW_UP_STAGE_LABELS, value);
}

/** Friendly label for a lead source. */
export function leadSourceLabel(value: string | null | undefined): string {
  return labelOf(LEAD_SOURCE_LABELS, value);
}

/** Friendly label for a client account status. */
export function clientStatusLabel(value: string | null | undefined): string {
  return labelOf(CLIENT_STATUS_LABELS, value);
}

/** Friendly label for a notification type. */
export function notificationTypeLabel(value: string | null | undefined): string {
  return labelOf(NOTIFICATION_TYPE_LABELS, value);
}

/**
 * The event a follow-up record represents, derived from the status that was
 * recorded on it.
 */
export function followUpEventLabel(status: string | null | undefined): string {
  if (status === "CONVERTED") return FOLLOW_UP_EVENT_LABELS.CONVERTED;
  if (status === "LOST") return FOLLOW_UP_EVENT_LABELS.LOST;
  return FOLLOW_UP_EVENT_LABELS.FOLLOW_UP;
}

/** True when the follow-up record is a conversion / loss event. */
export function isTerminalEvent(status: string | null | undefined): boolean {
  return status === "CONVERTED" || status === "LOST";
}
