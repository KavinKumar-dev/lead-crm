import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <PageSkeleton />
    </div>
  );
}
