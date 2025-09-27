import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminAnalytics from "@/components/admin/analytics";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["ADMIN"]}
        title="Platform Analytics"
        description="View platform-wide metrics and insights"
      >
        <AdminAnalytics />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
