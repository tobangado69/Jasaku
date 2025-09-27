import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminSupport from "@/components/admin/support";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="Support"
        description="Manage support tickets and customer inquiries"
      >
        <AdminSupport />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
