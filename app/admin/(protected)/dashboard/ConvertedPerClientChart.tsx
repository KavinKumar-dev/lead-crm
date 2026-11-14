"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];

/**
 * Client comparison chart: converted leads per client for the selected range.
 */
export default function ConvertedPerClientChart({
  data,
}: {
  data: { name: string; converted: number; total: number }[];
}) {
  const rows = [...data].sort((a, b) => b.converted - a.converted);

  if (rows.length === 0) {
    return (
      <div className="bg-white border rounded-xl shadow-sm p-8 text-center text-gray-500">
        No client data to chart yet.
      </div>
    );
  }

  // Long client names are shortened so the axis labels never push the chart
  // outside the screen.
  const shorten = (name: string) =>
    name.length > 12 ? `${name.slice(0, 11)}…` : name;

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 min-w-0">
      <h3 className="font-bold text-gray-800 mb-1">Converted Leads per Client</h3>
      <p className="text-xs text-gray-500 mb-3">
        Comparison for the selected period.
      </p>
      <div className="h-64 sm:h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickFormatter={shorten}
              interval="preserveStartEnd"
              angle={-15}
              textAnchor="end"
              height={55}
              minTickGap={4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={45}
            />
            <Tooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => `Client: ${label}`}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="converted" name="Converted" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {rows.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
