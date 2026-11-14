import Link from "next/link";
import { FileQuestion, Home, Search } from "lucide-react";

/**
 * Friendly 404 page.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-blue-100 text-blue-600 items-center justify-center">
          <FileQuestion size={28} />
        </span>

        <h1 className="mt-4 text-xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The page you are looking for does not exist, or it may have been
          moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Home size={16} />
            Go to home
          </Link>
          <Link
            href="/client/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Search size={16} />
            My dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
