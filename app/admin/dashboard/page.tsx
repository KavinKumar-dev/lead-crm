import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboard() {
  const session = await requireAdmin();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2">Welcome, {session.name} (Admin)</p>
      <LogoutButton redirectTo="/admin/login" />
    </div>
  );
}
