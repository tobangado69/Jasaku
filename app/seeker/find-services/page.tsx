import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeekerFindServices } from "@/components/seeker/find-services";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function SeekerFindServicesPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["SEEKER"]}
        title="Find Services"
        description="Discover and book services that meet your needs"
      >
        <SeekerFindServices />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
