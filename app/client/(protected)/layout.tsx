import { requireClient } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import Link from "next/link";
import { LayoutDashboard, UserPlus, List, Bell, CheckCircle, XCircle, LogOut, Menu, X, BarChart3, BellRing } from "lucide-react";
import { ReactNode } from "react";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const session = await requireClient();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r flex-shrink-0 flex flex-col">
        <div className="p-6">
          <span className="font-bold text-2xl text-green-600">Client CRM</span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <Link 
            href="/client/dashboard" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/client/leads/new" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserPlus size={20} />
            <span>Add New Lead</span>
          </Link>
          <Link 
            href="/client/leads" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <List size={20} />
            <span>All Leads</span>
          </Link>
          <Link 
            href="/client/follow-ups" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
            <span>Follow-Ups</span>
          </Link>
          <Link 
            href="/client/converted" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <CheckCircle size={20} />
            <span>Converted</span>
          </Link>
          <Link 
            href="/client/lost" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XCircle size={20} />
            <span>Lost</span>
          </Link>
          <Link 
            href="/client/reports" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </Link>
          <Link 
            href="/client/notifications" 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BellRing size={20} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              {session.name?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{session.name}</span>
              <span className="text-xs text-gray-500">ID: {session.id}</span>
            </div>
          </div>
          <LogoutButton redirectTo="/client/login" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with the notification bell */}
        <header className="flex items-center justify-between gap-4 bg-white border-b px-4 md:px-8 py-3 sticky top-0 z-40">
          <span className="text-sm text-gray-500 truncate">
            Signed in as{" "}
            <span className="font-semibold text-gray-800">{session.name}</span>
          </span>
          <NotificationBell scope="client" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
