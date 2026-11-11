import { requireClient } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function ClientDashboard() {
  const session = await requireClient();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Client Dashboard</h1>
      <p className="mt-2">Welcome, {session.name} (Client)</p>
      <LogoutButton redirectTo="/client/login" />
    </div>
  );
}
