"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2 } from "lucide-react";

/**
 * "Switch client" box: enter a 5-digit Client ID to jump straight to that
 * client's dashboard (viewing as admin).
 */
export default function SwitchClientBox({
  currentClientCode,
}: {
  currentClientCode: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a valid 5-digit Client ID.");
      return;
    }

    setError(null);
    setLoading(true);
    router.push(`/admin/clients/${trimmed}/dashboard`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3"
    >
      <div className="flex-1 space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-blue-600" />
          Switch client
        </label>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          inputMode="numeric"
          maxLength={5}
          placeholder="5-digit Client ID (e.g. 10245)"
          className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Client ID"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Opening..." : "Open dashboard"}
      </button>
      <p className="text-xs text-gray-500 sm:self-center">
        Currently viewing:{" "}
        <span className="font-mono font-bold text-blue-600">{currentClientCode}</span>
      </p>
    </form>
  );
}
