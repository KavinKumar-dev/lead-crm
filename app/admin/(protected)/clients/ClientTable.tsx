"use client";

import { useState } from "react";
import { toggleClientStatus, updateClient, resetClientPassword } from "./actions";
import { MoreVertical, Edit2, ShieldAlert, CheckCircle2, XCircle, Key, X, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleStatus = async (id: string) => {
    if (confirm("Are you sure you want to change this client's status?")) {
      await toggleClientStatus(id);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateClient({
        id: editingClient.id,
        clientName: formData.get("clientName") as string,
        businessName: formData.get("businessName") as string,
      });
      setEditingClient(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resettingClient) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await resetClientPassword({
        id: resettingClient.id,
        newPassword: formData.get("newPassword") as string,
      });
      setResettingClient(null);
      alert("Password reset successful");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
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
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/clients/${client.clientCode}/dashboard`}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="View Dashboard"
                      >
                        <LayoutDashboard size={18} />
                      </Link>
                      <button 
                        onClick={() => setEditingClient(client)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setResettingClient(client)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(client.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          client.status === "ACTIVE" ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"
                        }`}
                        title={client.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-gray-600">
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
              <button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? "Updating..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-red-600">Reset Password</h2>
              <button onClick={() => setResettingClient(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Enter a new password for <span className="font-bold text-gray-900">{resettingClient.clientName}</span></p>
              <div className="space-y-1">
                <label className="text-sm font-medium">New Password</label>
                <input name="newPassword" type="password" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Min 6 characters" />
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
