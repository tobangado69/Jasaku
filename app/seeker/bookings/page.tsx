import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeekerMyBookings } from "@/components/seeker/my-bookings";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function SeekerBookingsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["SEEKER"]}
        title="My Bookings"
        description="View and manage your service bookings"
      >
        <SeekerMyBookings />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
