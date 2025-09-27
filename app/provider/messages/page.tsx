import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProviderMessages } from "@/components/provider/messages";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function ProviderMessagesPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["PROVIDER"]}
        title="Messages"
        description="Communicate with your customers"
      >
        <ProviderMessages />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
