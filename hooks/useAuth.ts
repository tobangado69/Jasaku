"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;
  const user = session?.user;

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    session,
    logout,
  };
}

export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}

export function useRoleGuard(allowedRoles: string[]) {
  const { user, isAuthenticated, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = (user as any)?.role;
      if (!allowedRoles.includes(userRole)) {
        router.push("/unauthorized");
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasAccess: allowedRoles.includes((user as any)?.role),
  };
}