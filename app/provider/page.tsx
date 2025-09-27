import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderDashboard } from "@/components/provider/dashboard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderOverviewPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Provider Dashboard"
        description="Manage your services, bookings, and earnings"
      >
        <ProviderDashboard />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
