"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, Loader2, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body text explaining what is about to happen. */
  message?: React.ReactNode;
  /** Optional extra content (e.g. a summary of the record). */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = red (destructive), "primary" = blue/green (normal). */
  tone?: "danger" | "primary";
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog.
 *
 * Rendered as a bottom sheet on small screens and a centred dialog on
 * larger ones. Escape cancels, the backdrop cancels, and the page behind
 * the dialog is scroll-locked.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, isBusy, onCancel]);

  if (!open) return null;

  const Icon = tone === "danger" ? AlertTriangle : Info;
  const iconWrap =
    tone === "danger"
      ? "bg-red-100 text-red-600"
      : "bg-blue-100 text-blue-600";
  const confirmClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
      : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500";

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isBusy && onCancel()}
        aria-hidden="true"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3 p-5 pb-3">
          <span
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconWrap}`}
          >
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {message && (
              <div className="text-sm text-gray-600 mt-1">{message}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Close dialog"
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 -mr-1 -mt-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {children && <div className="px-5 pb-1">{children}</div>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {isBusy && <Loader2 size={16} className="animate-spin" />}
            {isBusy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
