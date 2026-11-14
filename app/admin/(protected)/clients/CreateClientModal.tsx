"use client";

import { useState } from "react";
import { createClient } from "./actions";
import { Plus, X } from "lucide-react";

export default function CreateClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      clientName: formData.get("clientName") as string,
      businessName: formData.get("businessName") as string,
      password: formData.get("password") as string,
    };

    try {
      const result = await createClient(data);
      if (result.success) {
        setNewClientId(result.clientCode);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setNewClientId(null);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
      >
        <Plus size={18} />
        <span>Create Client</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 sticky top-0">
              <h2 className="text-xl font-bold">Create New Client</h2>
              <button onClick={close} aria-label="Close" className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {newClientId ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Client Created Successfully!</h3>
                    <p className="text-gray-500">Share this ID with the client for login</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <span className="text-3xl font-mono font-bold tracking-widest text-blue-600">{newClientId}</span>
                  </div>
                  <button
                    onClick={close}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Client Name</label>
                    <input name="clientName" required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Business Name</label>
                    <input name="businessName" required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Acme Solutions" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Password</label>
                    <input name="password" type="password" required className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Min 6 characters" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Generate Client"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
