import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SeekerFavorites } from "@/components/seeker/favorites";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const dynamic = "force-dynamic";

export default function SeekerFavoritesPage() {
  return (
    <ErrorBoundary>
      <DashboardLayout
        allowedRoles={["SEEKER"]}
        title="Favorites"
        description="Your saved providers and services"
      >
        <SeekerFavorites />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
