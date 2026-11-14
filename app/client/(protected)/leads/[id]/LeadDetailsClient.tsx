"use client";

import { addFollowUp } from "../follow-up-actions";
import { markAsConverted, markAsLost } from "../conversion-actions";
import { format } from "date-fns";
import { FOLLOW_UP_STAGE, LEAD_STATUS } from "@/lib/constants";
import {
  followUpEventLabel,
  followUpStageLabel,
  isTerminalEvent,
  leadStatusLabel,
} from "@/lib/labels";
import { getDateRange, formatIstDate } from "@/lib/dateRange";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useState } from "react";

/**
 * Statuses a follow-up may set. NEW_LEAD is excluded on purpose: a lead that
 * has already been contacted must not fall back to "New Lead".
 */
const FOLLOW_UP_STATUSES = [
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.INTERESTED,
  LEAD_STATUS.NOT_RESPONDING,
  LEAD_STATUS.FOLLOW_UP_REQUIRED,
];

/** FormData -> plain string record (files are not used in these forms). */
function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    values[key] = typeof value === "string" ? value : "";
  });
  return values;
}

export default function LeadDetailsClient({ lead, history }: { lead: any; history: any[] }) {
  const [errors, setErrors] = useState<any>({});
  const [isBusy, setIsBusy] = useState(false);
  const [pending, setPending] = useState<null | {
    type: "convert" | "lost";
    data: Record<string, string>;
  }>(null);
  const today = formatIstDate(getDateRange("today").start);

  async function handleAddFollowUp(formData: FormData) {
    const nextDate = (formData.get("nextFollowUpDate") as string) || "";
    if (nextDate && nextDate < today) {
      setErrors({ nextFollowUpDate: ["Next Follow-Up Date cannot be before today."] });
      return;
    }
    const res: any = await addFollowUp(lead.id, Object.fromEntries(formData));
    if (res.success) window.location.reload();
    else setErrors(res.errors);
  }

  /** Intercept the form and ask for confirmation before changing the lead. */
  function handleConvertSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setPending({ type: "convert", data: formValues(new FormData(e.currentTarget)) });
  }

  function handleLostSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setPending({ type: "lost", data: formValues(new FormData(e.currentTarget)) });
  }

  /** Run the confirmed action. */
  async function confirmPending() {
    if (!pending) return;
    setIsBusy(true);
    const { type, data } = pending;

    try {
      const res: any =
        type === "convert"
          ? await markAsConverted(lead.id, data)
          : await markAsLost(lead.id, data);

      if (res.success) {
        window.location.reload();
      } else {
        setPending(null);
        setErrors(res.errors);
      }
    } catch (err: any) {
      setPending(null);
      setErrors({ form: err?.message || "Something went wrong." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-2xl font-bold">Lead: {lead.name} ({lead.leadCode})</h1>
        <p className="text-gray-500">Status: <span className="font-bold">{leadStatusLabel(lead.status)}</span></p>

        {['CONVERTED', 'LOST'].includes(lead.status) ? (
            <div className="mt-4 p-4 bg-gray-100 rounded">
                Outcome: {leadStatusLabel(lead.status)} {lead.lostReason && `- Reason: ${lead.lostReason}`}
            </div>
        ) : (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                {errors.form && (
                    <p className="md:col-span-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                        {errors.form}
                    </p>
                )}
                <form onSubmit={handleConvertSubmit} className="space-y-2 border p-4 rounded flex-1">
                    <h3 className="font-bold">Mark Converted</h3>
                    <div className="space-y-1">
                        <label htmlFor="convert-customerName" className="block text-xs font-medium text-gray-600">Customer Name</label>
                        <input id="convert-customerName" name="customerName" defaultValue={lead.name} className="block border w-full p-1 text-sm" />
                        {errors.customerName && <p className="text-red-500 text-[10px]">{errors.customerName}</p>}
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="convert-contactNumber" className="block text-xs font-medium text-gray-600">Contact Number</label>
                        <input id="convert-contactNumber" name="contactNumber" defaultValue={lead.mobile} className="block border w-full p-1 text-sm" />
                        {errors.contactNumber && <p className="text-red-500 text-[10px]">{errors.contactNumber}</p>}
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="convert-conversionDate" className="block text-xs font-medium text-gray-600">Conversion Date</label>
                        <input id="convert-conversionDate" name="conversionDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="block border w-full p-1 text-sm" />
                        {errors.conversionDate && <p className="text-red-500 text-[10px]">{errors.conversionDate}</p>}
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="convert-productService" className="block text-xs font-medium text-gray-600">Product / Service</label>
                        <input id="convert-productService" name="productService" placeholder="Product/Service" className="block border w-full p-1 text-sm" />
                        {errors.productService && <p className="text-red-500 text-[10px]">{errors.productService}</p>}
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="convert-orderValue" className="block text-xs font-medium text-gray-600">Order Value</label>
                        <input id="convert-orderValue" name="orderValue" type="number" placeholder="Value" className="block border w-full p-1 text-sm" />
                        {errors.orderValue && <p className="text-red-500 text-[10px]">{errors.orderValue}</p>}
                    </div>
                    <button className="bg-green-600 text-white px-4 py-1 rounded w-full min-h-[44px] text-sm font-bold">Convert</button>
                </form>
                <form onSubmit={handleLostSubmit} className="space-y-2 border p-4 rounded flex-1">
                    <h3 className="font-bold">Mark Lost</h3>
                    <div className="space-y-1">
                        <label htmlFor="lost-lostReason" className="block text-xs font-medium text-gray-600">Reason</label>
                        <select id="lost-lostReason" name="lostReason" className="w-full border p-1 text-sm">
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
                        <label htmlFor="lost-note" className="block text-xs font-medium text-gray-600">Details</label>
                        <input id="lost-note" name="note" placeholder="Reason details" className="block border w-full p-1 text-sm" />
                        {errors.note && <p className="text-red-500 text-[10px]">{errors.note}</p>}
                    </div>
                    <button className="bg-red-600 text-white px-4 py-1 rounded w-full min-h-[44px] text-sm font-bold">Lost</button>
                </form>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form action={handleAddFollowUp} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-bold">Add Follow-Up</h2>
          <div className="space-y-1">
            <label htmlFor="followup-stage" className="block text-xs font-medium text-gray-600">Follow-Up Stage</label>
            <select id="followup-stage" name="stage" className="w-full border p-2 rounded text-sm">
                {Object.values(FOLLOW_UP_STAGE).map(s => <option key={s} value={s}>{followUpStageLabel(s)}</option>)}
            </select>
            {errors.stage && <p className="text-red-500 text-[10px]">{errors.stage}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="followup-status" className="block text-xs font-medium text-gray-600">Lead Status</label>
            <select id="followup-status" name="status" className="w-full border p-2 rounded text-sm">
                {FOLLOW_UP_STATUSES.map(s => <option key={s} value={s}>{leadStatusLabel(s)}</option>)}
            </select>
            {errors.status && <p className="text-red-500 text-[10px]">{errors.status}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="followup-response" className="block text-xs font-medium text-gray-600">Customer Response</label>
            <input id="followup-response" name="customerResponse" placeholder="Customer Response" className="w-full border p-2 rounded text-sm" />
            {errors.customerResponse && <p className="text-red-500 text-[10px]">{errors.customerResponse}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="followup-note" className="block text-xs font-medium text-gray-600">Notes</label>
            <textarea id="followup-note" name="note" placeholder="Notes" className="w-full border p-2 rounded text-sm" />
            {errors.note && <p className="text-red-500 text-[10px]">{errors.note}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="followup-next" className="block text-xs font-medium text-gray-600">Next Follow-Up Date</label>
            <input id="followup-next" name="nextFollowUpDate" type="date" min={today} className="w-full border p-2 rounded text-sm" />
            {errors.nextFollowUpDate && <p className="text-red-500 text-[10px]">{errors.nextFollowUpDate}</p>}
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full min-h-[44px] font-bold">Save Follow-Up</button>
        </form>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-bold mb-4">Timeline ({history.length} contacts)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {history.map(item => (
              <div key={item.id} className="border-l-2 border-green-500 pl-4 py-1">
                <p className="font-bold text-sm">
                  {isTerminalEvent(item.status)
                    ? followUpEventLabel(item.status)
                    : `${followUpStageLabel(item.stage)} — ${leadStatusLabel(item.status)}`}
                </p>
                {item.customerResponse && <p className="text-sm italic">"{item.customerResponse}"</p>}
                {item.note && <p className="text-sm">{item.note}</p>}
                <p className="text-[10px] text-gray-400">{format(new Date(item.createdAt), "PPpp")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation before marking the lead as converted or lost */}
      <ConfirmDialog
        open={!!pending}
        title={pending?.type === "lost" ? "Mark lead as lost?" : "Mark lead as converted?"}
        tone={pending?.type === "lost" ? "danger" : "primary"}
        confirmLabel={pending?.type === "lost" ? "Yes, mark as lost" : "Yes, mark as converted"}
        cancelLabel="Cancel"
        isBusy={isBusy}
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
        message={
          pending?.type === "lost" ? (
            <>
              <span className="font-semibold text-gray-900">{lead.name}</span> (
              {lead.leadCode}) will be marked as <strong>Lost</strong>. The status
              is updated and an entry is added to the lead history.
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-900">{lead.name}</span> (
              {lead.leadCode}) will be marked as <strong>Converted</strong>. The
              status is updated and an entry is added to the lead history.
            </>
          )
        }
      />
    </div>
  );
}
