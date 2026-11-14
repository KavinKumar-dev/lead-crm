import { getClients } from "./actions";
import ClientSearch from "./ClientSearch";
import CreateClientModal from "./CreateClientModal";
import ClientTable from "./ClientTable";
import { Suspense } from "react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q;
  const clients = await getClients(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Client Management</h1>
          <p className="text-gray-500">Create and manage individual client accounts</p>
        </div>
        <CreateClientModal />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Suspense fallback={<div className="h-11 w-full sm:w-64 bg-gray-100 animate-pulse rounded-lg" />}>
          <ClientSearch />
        </Suspense>
        <div className="text-sm text-gray-500 font-medium">
          Total: {clients.length} Clients
        </div>
      </div>

      <Suspense fallback={<div className="h-96 bg-white border rounded-xl animate-pulse" />}>
        <ClientTable clients={clients} />
      </Suspense>
    </div>
  );
}
