"use client";

import { addFollowUp } from "../follow-up-actions";
import { markAsConverted, markAsLost } from "../conversion-actions";
import { format } from "date-fns";
import { FOLLOW_UP_STAGE } from "@/lib/constants";
import { useState } from "react";

export default function LeadDetailsClient({ lead, history }: { lead: any, history: any[] }) {
  const [errors, setErrors] = useState<any>({});

  async function handleAddFollowUp(formData: FormData) {
    const res: any = await addFollowUp(lead.id, Object.fromEntries(formData));
    if (res.success) window.location.reload();
    else setErrors(res.errors);
  }

  async function handleConvert(formData: FormData) {
    const res: any = await markAsConverted(lead.id, Object.fromEntries(formData));
    if (res.success) window.location.reload();
    else setErrors(res.errors);
  }

  async function handleLost(formData: FormData) {
    const res: any = await markAsLost(lead.id, Object.fromEntries(formData));
    if (res.success) window.location.reload();
    else setErrors(res.errors);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-2xl font-bold">Lead: {lead.name} ({lead.leadCode})</h1>
        <p className="text-gray-500">Status: <span className="font-bold">{lead.status}</span></p>
        
        {['CONVERTED', 'LOST'].includes(lead.status) ? (
            <div className="mt-4 p-4 bg-gray-100 rounded">
                Outcome: {lead.status} {lead.lostReason && `- Reason: ${lead.lostReason}`}
            </div>
        ) : (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <form action={handleConvert} className="space-y-2 border p-4 rounded flex-1">
                    <h3 className="font-bold">Mark Converted</h3>
                    <div className="space-y-1">
                        <input name="customerName" defaultValue={lead.name} className="block border w-full p-1 text-sm" />
                        {errors.customerName && <p className="text-red-500 text-[10px]">{errors.customerName}</p>}
                    </div>
                    <div className="space-y-1">
                        <input name="contactNumber" defaultValue={lead.mobile} className="block border w-full p-1 text-sm" />
                        {errors.contactNumber && <p className="text-red-500 text-[10px]">{errors.contactNumber}</p>}
                    </div>
                    <div className="space-y-1">
                        <input name="conversionDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="block border w-full p-1 text-sm" />
                        {errors.conversionDate && <p className="text-red-500 text-[10px]">{errors.conversionDate}</p>}
                    </div>
                    <div className="space-y-1">
                        <input name="productService" placeholder="Product/Service" className="block border w-full p-1 text-sm" />
                        {errors.productService && <p className="text-red-500 text-[10px]">{errors.productService}</p>}
                    </div>
                    <div className="space-y-1">
                        <input name="orderValue" type="number" placeholder="Value" className="block border w-full p-1 text-sm" />
                        {errors.orderValue && <p className="text-red-500 text-[10px]">{errors.orderValue}</p>}
                    </div>
                    <button className="bg-green-600 text-white px-4 py-1 rounded w-full text-sm font-bold">Convert</button>
                </form>
                <form action={handleLost} className="space-y-2 border p-4 rounded flex-1">
                    <h3 className="font-bold">Mark Lost</h3>
                    <div className="space-y-1">
                        <select name="lostReason" className="w-full border p-1 text-sm">
                            <option value="">Select Reason</option>
                            <option>Not Interested</option>
                            <option>Price Too High</option>
                            <option>Bought Elsewhere</option>
                            <option>No Response</option>
                            <option>Other</option>
                        </select>
                        {errors.lostReason && <p className="text-red-500 text-[10px]">{errors.lostReason}</p>}
                    </div>
                    <div className="space-y-1">
                        <input name="note" placeholder="Reason details" className="block border w-full p-1 text-sm" />
                        {errors.note && <p className="text-red-500 text-[10px]">{errors.note}</p>}
                    </div>
                    <button className="bg-red-600 text-white px-4 py-1 rounded w-full text-sm font-bold">Lost</button>
                </form>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form action={handleAddFollowUp} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-bold">Add Follow-Up</h2>
          <div className="space-y-1">
            <select name="stage" className="w-full border p-2 rounded text-sm">
                {Object.values(FOLLOW_UP_STAGE).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.stage && <p className="text-red-500 text-[10px]">{errors.stage}</p>}
          </div>
          <div className="space-y-1">
            <select name="status" className="w-full border p-2 rounded text-sm">
                {['NEW_LEAD', 'CONTACTED', 'INTERESTED', 'NOT_RESPONDING', 'FOLLOW_UP_REQUIRED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.status && <p className="text-red-500 text-[10px]">{errors.status}</p>}
          </div>
          <div className="space-y-1">
            <input name="customerResponse" placeholder="Customer Response" className="w-full border p-2 rounded text-sm" />
            {errors.customerResponse && <p className="text-red-500 text-[10px]">{errors.customerResponse}</p>}
          </div>
          <div className="space-y-1">
            <textarea name="note" placeholder="Notes" className="w-full border p-2 rounded text-sm" />
            {errors.note && <p className="text-red-500 text-[10px]">{errors.note}</p>}
          </div>
          <div className="space-y-1">
            <input name="nextFollowUpDate" type="date" className="w-full border p-2 rounded text-sm" />
            {errors.nextFollowUpDate && <p className="text-red-500 text-[10px]">{errors.nextFollowUpDate}</p>}
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full font-bold">Save Follow-Up</button>
        </form>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-bold mb-4">Timeline ({history.length} contacts)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {history.map(item => (
              <div key={item.id} className="border-l-2 border-green-500 pl-4 py-1">
                <p className="font-bold text-sm">{item.stage} - {item.status}</p>
                {item.customerResponse && <p className="text-sm italic">"{item.customerResponse}"</p>}
                {item.note && <p className="text-sm">{item.note}</p>}
                <p className="text-[10px] text-gray-400">{format(new Date(item.createdAt), "PPpp")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
