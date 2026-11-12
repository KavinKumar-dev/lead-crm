import LeadForm from "./LeadForm";

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
        <p className="text-gray-500">Enter customer details manually</p>
      </div>
      <LeadForm />
    </div>
  );
}
