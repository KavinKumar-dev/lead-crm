"use client";

import { useState } from "react";
import { toggleClientStatus, updateClient, resetClientPassword } from "./actions";
import { Edit2, ShieldAlert, CheckCircle2, XCircle, Key, X, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Client {
  id: string;
  clientCode: string;
  clientName: string;
  businessName: string;
  status: string;
  createdAt: Date;
  _count: { leads: number };
}

export default function ClientTable({ clients }: { clients: Client[] }) {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [resettingClient, setResettingClient] = useState<Client | null>(null);
  const [statusClient, setStatusClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggleStatus = async (id: string) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      await toggleClientStatus(id);
      setStatusClient(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Could not change the status." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    try {
      await updateClient({
        id: editingClient.id,
        clientName: formData.get("clientName") as string,
        businessName: formData.get("businessName") as string,
      });
      setEditingClient(null);
      setMessage({ type: "success", text: "Client details updated." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Could not save the changes." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resettingClient) return;
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    try {
      await resetClientPassword({
        id: resettingClient.id,
        newPassword: formData.get("newPassword") as string,
      });
      setResettingClient(null);
      setMessage({ type: "success", text: "Password reset successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Could not reset the password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeactivating = statusClient?.status === "ACTIVE";

  return (
    <div className="space-y-3">
      {message && (
        <div
          role="status"
          className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-sm font-medium">
              <th className="px-6 py-4">Client ID</th>
              <th className="px-6 py-4">Client / Business</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Leads</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">
                    {client.clientCode}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{client.clientName}</span>
                      <span className="text-sm text-gray-500">{client.businessName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      client.status === "ACTIVE" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {client.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{client._count.leads}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(client.createdAt), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/clients/${client.clientCode}/dashboard`}
                        className="inline-flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="View Dashboard"
                        aria-label={`Dashboard of ${client.clientName}`}
                      >
                        <LayoutDashboard size={18} />
                      </Link>
                      <button
                        onClick={() => setEditingClient(client)}
                        className="inline-flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Edit Details"
                        aria-label={`Edit ${client.clientName}`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setResettingClient(client)}
                        className="inline-flex items-center justify-center w-10 h-10 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Reset Password"
                        aria-label={`Reset password of ${client.clientName}`}
                      >
                        <Key size={18} />
                      </button>
                      <button
                        onClick={() => setStatusClient(client)}
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                          client.status === "ACTIVE" ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"
                        }`}
                        title={client.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        aria-label={`${client.status === "ACTIVE" ? "Deactivate" : "Activate"} ${client.clientName}`}
                      >
                        <ShieldAlert size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 sticky top-0">
              <h2 className="text-xl font-bold">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} aria-label="Close" className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Client Name</label>
                <input name="clientName" defaultValue={editingClient.clientName} required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Business Name</label>
                <input name="businessName" defaultValue={editingClient.businessName} required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full min-h-[44px] bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 sticky top-0">
              <h2 className="text-xl font-bold text-red-600">Reset Password</h2>
              <button onClick={() => setResettingClient(null)} aria-label="Close" className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Enter a new password for <span className="font-bold text-gray-900">{resettingClient.clientName}</span></p>
              <div className="space-y-1">
                <label className="text-sm font-medium">New Password</label>
                <input name="newPassword" type="password" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Min 6 characters" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full min-h-[44px] bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Activate / Deactivate confirmation */}
      <ConfirmDialog
        open={!!statusClient}
        title={isDeactivating ? "Deactivate client?" : "Activate client?"}
        tone={isDeactivating ? "danger" : "primary"}
        confirmLabel={isDeactivating ? "Deactivate" : "Activate"}
        cancelLabel="Cancel"
        isBusy={isSubmitting}
        onCancel={() => setStatusClient(null)}
        onConfirm={() => statusClient && handleToggleStatus(statusClient.id)}
        message={
          isDeactivating ? (
            <>
              <span className="font-semibold text-gray-900">
                {statusClient?.clientName} ({statusClient?.clientCode})
              </span>{" "}
              will no longer be able to log in. Their existing session is
              locked out immediately and their leads stay untouched.
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-900">
                {statusClient?.clientName} ({statusClient?.clientCode})
              </span>{" "}
              will be able to log in again.
            </>
          )
        }
      />
    </div>
  );
}
