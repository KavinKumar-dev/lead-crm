"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_SOURCE } from "@/lib/constants";

export interface LeadEditValues {
  name: string;
  mobile: string;
  source: string;
  campaignName: string;
  nextFollowUpDate: string | null;
  remarks: string;
}

export interface LeadEditResult {
  success: boolean;
  errors?: Record<string, string>;
}

export interface LeadEditFormProps {
  lead: {
    id: string;
    leadCode: string;
    name: string;
    mobile: string;
    source: string;
    campaignName: string;
    nextFollowUpDate: Date | string | null;
    remarks: string | null;
  };
  /** Server action that performs the update. */
  action: (values: LeadEditValues) => Promise<LeadEditResult>;
  /** Where to navigate after a successful save. */
  redirectTo: string;
  submitLabel?: string;
  theme?: "client" | "admin";
}

/**
 * Shared lead edit form used by both the client ("/client/leads/[id]/edit")
 * and the admin ("/admin/leads/[id]/edit"). Validation errors are returned by
 * the server action and rendered inline next to the offending field.
 */
export default function LeadEditForm({
  lead,
  action,
  redirectTo,
  submitLabel = "Save Changes",
  theme = "client",
}: LeadEditFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const accent = theme === "admin" ? "blue" : "green";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const values: LeadEditValues = {
      name: (formData.get("name") as string) || "",
      mobile: (formData.get("mobile") as string) || "",
      source: (formData.get("source") as string) || "",
      campaignName: (formData.get("campaignName") as string) || "",
      nextFollowUpDate: (formData.get("nextFollowUpDate") as string) || null,
      remarks: (formData.get("remarks") as string) || "",
    };

    try {
      const result = await action(values);
      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setErrors(result.errors || { _form: "Could not save changes." });
      }
    } catch (err: any) {
      setErrors({ _form: err?.message || "Could not save changes." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusRing =
    accent === "blue" ? "focus:ring-blue-500" : "focus:ring-green-500";
  const buttonClass =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-green-600 hover:bg-green-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl border shadow-sm space-y-4 max-w-2xl"
    >
      {errors._form && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Customer Name</label>
          <input
            name="name"
            defaultValue={lead.name}
            className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing}`}
            placeholder="e.g. Jane Doe"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mobile Number</label>
          <input
            name="mobile"
            defaultValue={lead.mobile}
            inputMode="numeric"
            className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing}`}
            placeholder="10 digit number"
          />
          {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Lead Source</label>
          <select
            name="source"
            defaultValue={lead.source}
            className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing} bg-white`}
          >
            {Object.values(LEAD_SOURCE).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.source && <p className="text-xs text-red-500">{errors.source}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Campaign Name</label>
          <input
            name="campaignName"
            defaultValue={lead.campaignName}
            className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing}`}
            placeholder="e.g. Winter Sale"
          />
          {errors.campaignName && (
            <p className="text-xs text-red-500">{errors.campaignName}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Next Follow-Up Date</label>
        <input
          name="nextFollowUpDate"
          type="date"
          defaultValue={
            lead.nextFollowUpDate
              ? new Date(lead.nextFollowUpDate).toISOString().slice(0, 10)
              : ""
          }
          className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing}`}
        />
        {errors.nextFollowUpDate && (
          <p className="text-xs text-red-500">{errors.nextFollowUpDate}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Remarks</label>
        <textarea
          name="remarks"
          rows={3}
          defaultValue={lead.remarks || ""}
          className={`w-full border rounded-lg p-2 outline-none focus:ring-2 ${focusRing}`}
          placeholder="Additional notes..."
        />
        {errors.remarks && <p className="text-xs text-red-500">{errors.remarks}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-5 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${buttonClass}`}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
