import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboard } from "@/components/admin/dashboard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="Admin Dashboard"
        description="Manage the platform and monitor system performance"
      >
        <AdminDashboard />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
