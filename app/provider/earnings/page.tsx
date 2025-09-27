import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderEarnings } from "@/components/provider/earnings";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderEarningsPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Earnings"
        description="Track your revenue and payment history"
      >
        <ProviderEarnings />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
