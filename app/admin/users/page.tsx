import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminUsers } from "@/components/admin/users";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="User Management"
        description="Manage users, roles, and permissions"
      >
        <AdminUsers />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
