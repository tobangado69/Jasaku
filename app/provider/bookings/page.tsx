import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderBookings } from "@/components/provider/bookings";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderBookingsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Bookings"
        description="Manage your service bookings and appointments"
      >
        <ProviderBookings />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
