"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import type { NotificationScope } from "@/lib/notificationTypes";

/**
 * Marks every stored notification of the current scope as read.
 *
 * The scope decides the endpoint; the client scope is resolved from the
 * session on the server, never from the browser.
 */
export default function MarkAllReadButton({
  scope,
  disabled,
}: {
  scope: NotificationScope;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const endpoint =
    scope === "admin"
      ? "/api/notifications/admin"
      : "/api/notifications/client";

  const markAll = async () => {
    setBusy(true);
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      router.refresh();
    } catch {
      // Ignore — the refreshed page shows the real state.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={markAll}
      disabled={disabled || busy}
      className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-white shadow-sm"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
      Mark all as read
    </button>
  );
}
