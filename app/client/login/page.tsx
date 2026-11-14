"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, LogIn } from "lucide-react";

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCode, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.push("/client/dashboard");
      } else {
        setError(data.error || "Login failed. Please check your details.");
        setIsSubmitting(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border rounded-2xl shadow-sm p-6 sm:p-8 space-y-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Client Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in with the Client ID you received.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-start gap-2"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="clientCode" className="block text-sm font-medium text-gray-700">
            Client ID
          </label>
          <input
            id="clientCode"
            name="clientCode"
            inputMode="numeric"
            maxLength={5}
            required
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            placeholder="5-digit Client ID"
            className="w-full border rounded-lg p-2.5 min-h-[44px] outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded-lg p-2.5 min-h-[44px] outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-green-600 text-white p-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} />
              Login
            </>
          )}
        </button>
      </form>
    </div>
  );
}
