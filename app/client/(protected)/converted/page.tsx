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
      <table className="w-full bg-white border">
        <tr className="bg-gray-50 border-b">
            <th className="p-3">Customer</th>
            <th className="p-3">Product</th>
            <th className="p-3">Value</th>
            <th className="p-3">Date</th>
        </tr>
        {conversions.map(c => (
            <tr key={c.id} className="border-b">
                <td className="p-3">{c.customerName}</td>
                <td className="p-3">{c.productService}</td>
                <td className="p-3">{c.orderValue}</td>
                <td className="p-3">{format(c.conversionDate, "PP")}</td>
            </tr>
        ))}
      </table>
    </div>
  );
}
