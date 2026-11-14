"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { searchLeads, GlobalSearchResult } from "../search/actions";

/**
 * Global search box (admin layout header). Finds a lead by name, mobile
 * number or Lead ID across all clients.
 */
export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search as the admin types.
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchLeads(term);
      if (res.success) {
        setResults(res.results);
        setOpen(true);
      } else {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      setOpen(false);
      router.push(`/admin/leads/${results[0].id}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search lead by name, mobile or Lead ID..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
            aria-label="Global lead search"
          />
          {loading && (
            <Loader2
              size={14}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {open && query.trim() && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No leads found.</p>
          ) : (
            <ul className="divide-y">
              {results.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {lead.name}{" "}
                        <span className="font-mono text-xs text-blue-600">
                          {lead.leadCode}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {lead.mobile} · {lead.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {lead.clientName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
