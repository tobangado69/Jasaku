import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminPayments from "@/components/admin/payments";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="Payment Management"
        description="Monitor and manage platform payments"
      >
        <AdminPayments />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
