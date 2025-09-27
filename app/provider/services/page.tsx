import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderServices } from "@/components/provider/services";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderServicesPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Services"
        description="Manage your service offerings and availability"
      >
        <ProviderServices />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
