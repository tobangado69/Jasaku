/**
 * Authentication module exports
 * Centralized auth utilities for the application
 */

// Core auth configuration
export { authOptions } from "@/lib/auth"

// Server-side middleware utilities
export {
  requireAuth,
  requireRole,
  requireOwnershipOrAdmin,
  requireAdmin,
  requireProvider,
  requireSeeker,
  withAuth,
  withRole,
  createAuthErrorResponse,
  getCurrentUserId,
  getCurrentUserRole,
  isCurrentUserAdmin,
  type AuthResult,
  type AuthorizationResult,
} from "./middleware"

// Client-side hooks (re-export for convenience)
export {
  useAuth,
  useRequireAuth,
  useRoleGuard,
  useAdminGuard,
  useProviderGuard,
  useSeekerGuard,
  type AuthUser,
  type UserRole,
  type UseAuthReturn,
} from "@/hooks/useAuth"

// HOC components
export {
  withAuth as withAuthComponent,
  withRole as withRoleComponent,
  withAdminAuth,
  withProviderAuth,
  withSeekerAuth,
  withMultiRoleAuth,
} from "@/components/auth/withAuth"

