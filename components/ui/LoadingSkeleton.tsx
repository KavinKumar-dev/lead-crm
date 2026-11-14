/**
 * Loading skeletons.
 *
 * Used by the route-level loading.tsx files so a slow request shows a
 * placeholder instead of a blank screen.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** Page-level placeholder: a title block plus a few content cards. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-72 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Placeholder for a data table. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="bg-white border rounded-xl overflow-hidden shadow-sm"
      role="status"
      aria-label="Loading"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-4 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
