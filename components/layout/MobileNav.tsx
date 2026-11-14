"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import { NAV_ICONS } from "./navIcons";
import type { NavItem } from "@/lib/nav";

export interface MobileNavProps {
  items: NavItem[];
  title: string;
  theme: "client" | "admin";
  userName?: string;
  userMeta?: string;
  logoutRedirect: string;
}

/**
 * Mobile navigation.
 *
 * On small screens the sidebar is hidden and this component renders a menu
 * button that opens a slide-over drawer. The button is at least 40px tall so
 * it is easy to tap.
 */
export default function MobileNav({
  items,
  title,
  theme,
  userName,
  userMeta,
  logoutRedirect,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock the page behind the drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isAdmin = theme === "admin";
  const accentText = isAdmin ? "text-blue-600" : "text-green-600";
  const avatarBg = isAdmin ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600";
  const activeBg = isAdmin
    ? "bg-blue-50 text-blue-700"
    : "bg-green-50 text-green-700";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Menu button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="md:hidden inline-flex items-center justify-center w-11 h-11 -ml-1 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <nav
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className={`font-bold text-xl ${accentText}`}>{title}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-3 space-y-1 flex-1">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] ${
                      isActive(item.href)
                        ? `${activeBg} font-semibold`
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {userName && (
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 p-2 mb-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 ${avatarBg}`}
                  >
                    {userName[0]}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{userName}</span>
                    {userMeta && (
                      <span className="text-xs text-gray-500 truncate">{userMeta}</span>
                    )}
                  </div>
                </div>
                <LogoutButton redirectTo={logoutRedirect} />
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
