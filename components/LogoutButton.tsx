"use client";

export default function LogoutButton({ redirectTo }: { redirectTo: string }) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = redirectTo;
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-4 p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Logout
    </button>
  );
}
