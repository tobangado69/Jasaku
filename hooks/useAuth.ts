"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useMemo } from "react";
import { Session } from "next-auth";

/**
 * User type from session
 */
export type AuthUser = Session["user"];

/**
 * Role type
 */
export type UserRole = "SEEKER" | "PROVIDER" | "ADMIN";

/**
 * Auth hook return type
 */
export interface UseAuthReturn {
  user: AuthUser | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isProvider: boolean;
  isSeeker: boolean;
}

/**
 * Main authentication hook
 * Provides user session data and authentication status
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;
  const user = session?.user;

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);
  const isProvider = useMemo(() => user?.role === "PROVIDER", [user]);
  const isSeeker = useMemo(() => user?.role === "SEEKER", [user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    session: session || null,
    logout,
    hasRole,
    isAdmin,
    isProvider,
    isSeeker,
  };
}

/**
 * Hook that requires authentication
 * Redirects to sign-in page if not authenticated
 */
export function useRequireAuth(): Omit<UseAuthReturn, "session" | "logout"> {
  const { user, isAuthenticated, isLoading, hasRole, isAdmin, isProvider, isSeeker } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/signin?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isProvider,
    isSeeker,
  };
}

/**
 * Hook that requires specific role(s)
 * Redirects to unauthorized page if user doesn't have required role
 */
export function useRoleGuard(
  allowedRoles: UserRole | UserRole[]
): Omit<UseAuthReturn, "session" | "logout"> & { hasAccess: boolean } {
  const { user, isAuthenticated, isLoading, hasRole, isAdmin, isProvider, isSeeker } = useRequireAuth();
  const router = useRouter();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = useMemo(() => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user, roles]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, isLoading, hasAccess, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasAccess,
    hasRole,
    isAdmin,
    isProvider,
    isSeeker,
  };
}

/**
 * Hook for admin-only pages
 */
export function useAdminGuard() {
  return useRoleGuard("ADMIN");
}

/**
 * Hook for provider-only pages
 */
export function useProviderGuard() {
  return useRoleGuard("PROVIDER");
}

/**
 * Hook for seeker-only pages
 */
export function useSeekerGuard() {
  return useRoleGuard("SEEKER");
}