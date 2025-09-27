import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeekerDashboard } from "@/components/seeker/dashboard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function SeekerOverviewPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["SEEKER"]}
        title="Seeker Dashboard"
        description="Find and book services that meet your needs"
      >
        <SeekerDashboard />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
