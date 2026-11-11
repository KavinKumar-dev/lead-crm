import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Lead CRM</h1>
      <div className="flex gap-4">
        <a href="/admin/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Admin Login</a>
        <a href="/client/login" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Client Login</a>
      </div>
    </main>
  );
}
