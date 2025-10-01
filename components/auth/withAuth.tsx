"use client";

import { useRequireAuth, useRoleGuard, UserRole } from "@/hooks/useAuth";
import { ComponentType } from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading component for auth guards
 */
function AuthLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

/**
 * Higher-order component that requires authentication
 * Redirects to sign-in if not authenticated
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function AuthGuardedComponent(props: P) {
    const { isLoading, isAuthenticated } = useRequireAuth();

    if (isLoading) {
      return <AuthLoadingState />;
    }

    if (!isAuthenticated) {
      return null; // Will redirect via useRequireAuth hook
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component that requires specific role(s)
 * Redirects to unauthorized page if user doesn't have required role
 */
export function withRole<P extends object>(
  allowedRoles: UserRole | UserRole[]
) {
  return function (Component: ComponentType<P>): ComponentType<P> {
    return function RoleGuardedComponent(props: P) {
      const { isLoading, hasAccess } = useRoleGuard(allowedRoles);

      if (isLoading) {
        return <AuthLoadingState />;
      }

      if (!hasAccess) {
        return null; // Will redirect via useRoleGuard hook
      }

      return <Component {...props} />;
    };
  };
}

/**
 * HOC for admin-only pages
 */
export function withAdminAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withRole<P>("ADMIN")(Component);
}

/**
 * HOC for provider-only pages
 */
export function withProviderAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withRole<P>("PROVIDER")(Component);
}

/**
 * HOC for seeker-only pages
 */
export function withSeekerAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return withRole<P>("SEEKER")(Component);
}

/**
 * HOC for pages accessible by multiple roles
 */
export function withMultiRoleAuth<P extends object>(allowedRoles: UserRole[]) {
  return function (Component: ComponentType<P>): ComponentType<P> {
    return withRole<P>(allowedRoles)(Component);
  };
}
