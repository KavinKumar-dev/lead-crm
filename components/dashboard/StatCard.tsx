import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  href: string;
  icon: React.ComponentType<{ size?: number | string }>;
  color: string;
  bg: string;
}

/** A single KPI tile that links to the matching filtered list. */
export default function StatCard({
  label,
  value,
  href,
  icon: Icon,
  color,
  bg,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white p-3 sm:p-4 rounded-xl border shadow-sm hover:shadow-md hover:border-green-300 transition-all flex items-start justify-between gap-2 min-h-[76px]"
    >
      <div className="min-w-0">
        <p className="text-[11px] sm:text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${color}`}>{value}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1">
        <span className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon size={18} />
        </span>
        <ArrowUpRight
          size={14}
          className="text-gray-300 group-hover:text-green-500 transition-colors"
        />
      </div>
      <span className={`sm:hidden p-1.5 rounded-lg shrink-0 ${bg} ${color}`}>
        <Icon size={16} />
      </span>
    </Link>
  );
}
