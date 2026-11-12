import { getAdminStats } from "./actions";
import { Users, UserCheck, UserX } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Active Clients",
      value: stats.activeClients,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Inactive Clients",
      value: stats.inactiveClients,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-500">Monitor your client network</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
