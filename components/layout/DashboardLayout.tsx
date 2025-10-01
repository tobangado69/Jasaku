"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGuard } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles: string[];
  title: string;
  description?: string;
}

export function DashboardLayout({
  children,
  allowedRoles,
  title,
  description,
}: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useRoleGuard(allowedRoles);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRole = (user as any)?.role?.toLowerCase() as
    | "provider"
    | "seeker"
    | "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar userRole={userRole} user={user} />

        <div className="flex-1">
          <main className="w-full p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-gray-600 mt-2">{description}</p>
              )}
            </div>

            {/* Content */}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
