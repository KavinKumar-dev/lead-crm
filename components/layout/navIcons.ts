import {
  BarChart3,
  Bell,
  BellRing,
  CheckCircle,
  LayoutDashboard,
  List,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "@/lib/nav";

/**
 * Maps a nav icon name to its lucide component.
 *
 * Shared by the desktop sidebar (server component) and the mobile drawer
 * (client component).
 */
export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  addLead: UserPlus,
  list: List,
  bell: Bell,
  check: CheckCircle,
  x: XCircle,
  chart: BarChart3,
  bellRing: BellRing,
  users: Users,
};
