"use client";
import { LogOut } from "lucide-react";

export default function LogoutButton({ redirectTo }: { redirectTo: string }) {
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = redirectTo;
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium mt-1"
    >
      <LogOut size={20} />
      <span>Logout</span>
    </button>
  );
}
