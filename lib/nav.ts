/**
 * Navigation items shared by the desktop sidebar and the mobile drawer.
 *
 * Icons are referenced by name (not by component) so the list can be passed
 * from a server component to a client component — functions are not
 * serialisable across the server/client boundary.
 */

export type NavIconName =
  | "dashboard"
  | "addLead"
  | "list"
  | "bell"
  | "check"
  | "x"
  | "chart"
  | "bellRing"
  | "users";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export const CLIENT_NAV: NavItem[] = [
  { href: "/client/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/client/leads/new", label: "Add New Lead", icon: "addLead" },
  { href: "/client/leads", label: "All Leads", icon: "list" },
  { href: "/client/follow-ups", label: "Follow-Ups", icon: "bell" },
  { href: "/client/converted", label: "Converted", icon: "check" },
  { href: "/client/lost", label: "Lost", icon: "x" },
  { href: "/client/reports", label: "Reports", icon: "chart" },
  { href: "/client/notifications", label: "Notifications", icon: "bellRing" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/leads", label: "All Leads", icon: "list" },
  { href: "/admin/clients", label: "Client Management", icon: "users" },
  { href: "/admin/reports", label: "Reports", icon: "chart" },
  { href: "/admin/notifications", label: "Notifications", icon: "bellRing" },
];
