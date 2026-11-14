import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/layout/MobileNav";
import { NAV_ICONS } from "@/components/layout/navIcons";
import NotificationBell from "@/components/notifications/NotificationBell";
import GlobalSearch from "./search/GlobalSearch";
import { ADMIN_NAV } from "@/lib/nav";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile header with the menu button */}
      <header className="md:hidden flex items-center gap-2 bg-white border-b px-3 py-2 sticky top-0 z-40">
        <MobileNav
          items={ADMIN_NAV}
          title="Lead CRM"
          theme="admin"
          userName={session.name}
          userMeta="Administrator"
          logoutRedirect="/admin/login"
        />
        <span className="font-bold text-lg text-blue-600 truncate">Admin Panel</span>
        <div className="ml-auto">
          <NotificationBell scope="admin" />
        </div>
      </header>

      {/* Sidebar (desktop only — on mobile it lives in the drawer) */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-shrink-0 flex-col">
        <div className="p-6">
          <span className="font-bold text-2xl text-blue-600">Lead CRM</span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {ADMIN_NAV.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {session.name?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{session.name}</span>
              <span className="text-xs text-gray-500">Administrator</span>
            </div>
          </div>
          <LogoutButton redirectTo="/admin/login" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with global search + notification bell (desktop) */}
        <header className="hidden md:flex items-center justify-between gap-4 bg-white border-b px-8 py-3 sticky top-0 z-40">
          <span className="text-sm text-gray-500">
            Signed in as <span className="font-semibold text-gray-800">{session.name}</span>
          </span>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationBell scope="admin" />
          </div>
        </header>

        {/* Mobile global search */}
        <div className="md:hidden bg-white border-b px-4 py-2">
          <GlobalSearch />
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
