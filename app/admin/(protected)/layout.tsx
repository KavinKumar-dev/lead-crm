import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import GlobalSearch from "./search/GlobalSearch";
import Link from "next/link";
import { LayoutDashboard, Users, LogOut, List, Menu, X } from "lucide-react";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <span className="font-bold text-xl text-blue-600">Admin Panel</span>
        {/* Mobile menu toggle would go here, simplified for now */}
      </header>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r flex-shrink-0 flex flex-col">
        <div className="p-6 hidden md:block">
          <span className="font-bold text-2xl text-blue-600">Lead CRM</span>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/leads"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <List size={20} />
            <span>All Leads</span>
          </Link>
          <Link
            href="/admin/clients"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users size={20} />
            <span>Client Management</span>
          </Link>
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
        {/* Header with global search */}
        <header className="hidden md:flex items-center justify-between gap-4 bg-white border-b px-8 py-3 sticky top-0 z-40">
          <span className="text-sm text-gray-500">
            Signed in as <span className="font-semibold text-gray-800">{session.name}</span>
          </span>
          <GlobalSearch />
        </header>

        {/* Mobile global search */}
        <div className="md:hidden bg-white border-b px-4 py-3">
          <GlobalSearch />
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
