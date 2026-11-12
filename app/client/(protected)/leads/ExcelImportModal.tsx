"use client";

import { useState } from "react";
import { importLeads } from "./actions";
import { Upload, X, AlertTriangle, CheckCircle } from "lucide-react";

export default function ExcelImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<{ successCount: number; errors: { row: number; error: string }[] } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setReport(null);
    setIsSubmitting(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        setFileError("CSV file must have a header row and at least one data row.");
        setIsSubmitting(false);
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIdx = headers.indexOf("name");
      const mobileIdx = headers.indexOf("mobile");
      const sourceIdx = headers.indexOf("source");
      const campaignIdx = headers.indexOf("campaign");

      if (nameIdx === -1 || mobileIdx === -1) {
        setFileError("CSV must contain 'name' and 'mobile' columns in header.");
        setIsSubmitting(false);
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (cols.length < 2) continue;
        rows.push({
          name: cols[nameIdx] || "",
          mobile: cols[mobileIdx] || "",
          source: sourceIdx !== -1 ? cols[sourceIdx] : "OTHER",
          campaignName: campaignIdx !== -1 ? cols[campaignIdx] : "CSV Import",
        });
      }

      if (rows.length > 500) {
        setFileError("File exceeds maximum of 500 rows limit.");
        setIsSubmitting(false);
        return;
      }

      const res = await importLeads(rows);
      setReport(res);
    } catch (err: any) {
      setFileError(err.message || "Failed to parse CSV file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setReport(null);
    setFileError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
      >
        <Upload size={18} />
        <span>Import CSV</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold">Import Leads (CSV)</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Upload a CSV file with columns: <code className="bg-gray-100 px-1 py-0.5 rounded">name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">mobile</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">source</code> (optional), <code className="bg-gray-100 px-1 py-0.5 rounded">campaign</code> (optional). Max 500 rows.
              </p>

              {fileError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{fileError}</span>
                </div>
              )}

              {report && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>Successfully imported {report.successCount} leads!</span>
                  </div>

                  {report.errors.length > 0 && (
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                      <p className="text-xs font-bold text-red-600 mb-1">Row Errors ({report.errors.length}):</p>
                      {report.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-red-500">
                          Row {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isSubmitting}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />

              <div className="flex justify-end">
                <button
                  onClick={close}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
