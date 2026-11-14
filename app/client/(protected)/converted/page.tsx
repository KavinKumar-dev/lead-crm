import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";
import Link from "next/link";
import { format } from "date-fns";

export default async function ConvertedPage() {
  const session = await requireClient();
  const conversions = await db.conversion.findMany({
    where: { clientId: session.id },
    include: { lead: true }
  });

  const total = conversions.reduce((sum, c) => sum + (c.orderValue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Converted Leads</h1>
        <div className="bg-green-100 p-4 rounded text-green-800 font-bold">Total Order Value: {total}</div>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
                <th className="p-3">Customer</th>
                <th className="p-3">Product</th>
                <th className="p-3">Value</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {conversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No conversions yet.
                  </td>
                </tr>
              ) : (
                conversions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{c.customerName}</td>
                    <td className="p-3 text-gray-600">{c.productService}</td>
                    <td className="p-3 text-gray-600">
                      {c.orderValue != null
                        ? `₹${c.orderValue.toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {format(c.conversionDate, "PP")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
