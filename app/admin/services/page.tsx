import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminServices from "@/components/admin/services";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminServicesPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="Service Management"
        description="Moderate and manage platform services"
      >
        <AdminServices />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
