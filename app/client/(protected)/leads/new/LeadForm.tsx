"use client";

import { useState } from "react";
import { createLead, checkDuplicateLead } from "../actions";
import { useRouter } from "next/navigation";
import { LEAD_SOURCE } from "@/lib/constants";
import { leadSourceLabel } from "@/lib/labels";

export default function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const mobile = formData.get("mobile") as string;

    const isDuplicate = await checkDuplicateLead(mobile);
    if (isDuplicate) {
      if (!confirm("A lead with this mobile number already exists. Do you want to continue?")) {
        setIsSubmitting(false);
        return;
      }
    }

    const data = {
      name: formData.get("name") as string,
      mobile: mobile,
      source: formData.get("source") as string,
      campaignName: formData.get("campaignName") as string,
      nextFollowUpDate: (formData.get("nextFollowUpDate") as string) || null,
      remarks: formData.get("remarks") as string,
    };

    try {
      const res = await createLead(data);
      if (res.success) {
        router.push("/client/leads");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-xl border shadow-sm space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Customer Name</label>
          <input name="name" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Jane Doe" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Mobile Number</label>
          <input name="mobile" required pattern="\d{10}" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="10 digit number" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Lead Source</label>
          <select name="source" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500">
            {Object.values(LEAD_SOURCE).map(s => <option key={s} value={s}>{leadSourceLabel(s)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Campaign Name</label>
          <input name="campaignName" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Winter Sale" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Next Follow-Up Date (Optional)</label>
        <input name="nextFollowUpDate" type="date" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Remarks</label>
        <textarea name="remarks" rows={3} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-green-500" placeholder="Additional notes..." />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Creating..." : "Create Lead"}
      </button>
    </form>
  );
}
