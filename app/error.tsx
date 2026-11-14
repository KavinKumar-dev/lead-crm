"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

/**
 * Friendly error boundary.
 *
 * Replaces the raw Next.js crash screen with a readable message, a retry
 * button and a way back to a safe page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the details in the server logs, show something friendly on screen.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-red-100 text-red-600 items-center justify-center">
          <AlertTriangle size={28} />
        </span>

        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          The page could not be loaded. This is usually temporary — try again,
          and if it keeps happening contact your administrator.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-gray-400 font-mono">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Home size={16} />
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
