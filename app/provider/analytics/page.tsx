import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderAnalytics } from "@/components/provider/analytics";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderAnalyticsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Analytics"
        description="View your performance metrics and insights"
      >
        <ProviderAnalytics />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
