import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/layout/MobileNav";
import { NAV_ICONS } from "@/components/layout/navIcons";
import NotificationBell from "@/components/notifications/NotificationBell";
import { CLIENT_NAV } from "@/lib/nav";
import Link from "next/link";
import { ReactNode } from "react";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireClient();

  // Show the 5-digit Client ID (the one the client logs in with), not the
  // internal database id.
  const client = await db.client.findUnique({
    where: { id: session.id },
    select: { clientCode: true },
  });
  const clientLabel = client?.clientCode ?? session.id;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile header with the menu button */}
      <header className="md:hidden flex items-center gap-2 bg-white border-b px-3 py-2 sticky top-0 z-40">
        <MobileNav
          items={CLIENT_NAV}
          title="Client CRM"
          theme="client"
          userName={session.name}
          userMeta={`ID: ${clientLabel}`}
          logoutRedirect="/client/login"
        />
        <span className="font-bold text-lg text-green-600 truncate">Client CRM</span>
        <div className="ml-auto">
          <NotificationBell scope="client" />
        </div>
      </header>

      {/* Sidebar (desktop only — on mobile it lives in the drawer) */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-shrink-0 flex-col">
        <div className="p-6">
          <span className="font-bold text-2xl text-green-600">Client CRM</span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {CLIENT_NAV.map((item) => {
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

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              {session.name?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{session.name}</span>
              <span className="text-xs text-gray-500">ID: {clientLabel}</span>
            </div>
          </div>
          <LogoutButton redirectTo="/client/login" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with the notification bell (desktop) */}
        <header className="hidden md:flex items-center justify-between gap-4 bg-white border-b px-8 py-3 sticky top-0 z-40">
          <span className="text-sm text-gray-500 truncate">
            Signed in as{" "}
            <span className="font-semibold text-gray-800">{session.name}</span>
          </span>
          <NotificationBell scope="client" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
