"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface ClientOption {
  id: string;
  clientCode: string;
  clientName: string;
}

/**
 * Optional client filter for the admin reports page. Stored in the URL so
 * the preview and the downloaded file always describe the same scope.
 */
export default function AdminReportClientFilter({
  clients,
}: {
  clients: ClientOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("client", value);
    else params.delete("client");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Client filter (optional)
      </label>
      <select
        value={searchParams.get("client")?.toString() || ""}
        onChange={(e) => update(e.target.value)}
        disabled={isPending}
        className="w-full sm:w-80 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
      >
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.clientCode}>
            {c.clientName} ({c.clientCode})
          </option>
        ))}
      </select>
    </div>
  );
}
