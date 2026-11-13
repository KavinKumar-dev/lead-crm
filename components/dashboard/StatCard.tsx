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
      className="group bg-white p-4 rounded-xl border shadow-sm hover:shadow-md hover:border-green-300 transition-all flex items-start justify-between gap-2"
    >
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon size={18} />
        </span>
        <ArrowUpRight
          size={14}
          className="text-gray-300 group-hover:text-green-500 transition-colors"
        />
      </div>
    </Link>
  );
}
