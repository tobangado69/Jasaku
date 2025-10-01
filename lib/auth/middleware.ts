import { NextRequest, NextResponse } from "next/server"
import { getServerSession, Session } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Authentication result type
 */
export interface AuthResult {
  success: boolean
  session?: Session
  error?: {
    message: string
    status: number
  }
}

/**
 * Role-based authorization result
 */
export interface AuthorizationResult extends AuthResult {
  authorized: boolean
}

/**
 * Verify user is authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return {
      success: false,
      error: {
        message: "Unauthorized - Authentication required",
        status: 401
      }
    }
  }

  // Check if user is active
  if (session.user.status !== "ACTIVE") {
    return {
      success: false,
      error: {
        message: `Account is ${session.user.status.toLowerCase()}`,
        status: 403
      }
    }
  }

  return {
    success: true,
    session
  }
}

/**
 * Verify user has required role(s)
 */
export async function requireRole(
  allowedRoles: Array<"SEEKER" | "PROVIDER" | "ADMIN">
): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.success || !authResult.session) {
    return {
      ...authResult,
      authorized: false
    }
  }

  const userRole = authResult.session.user.role
  const hasRole = allowedRoles.includes(userRole)

  if (!hasRole) {
    return {
      success: false,
      authorized: false,
      error: {
        message: `Forbidden - Required role: ${allowedRoles.join(" or ")}`,
        status: 403
      }
    }
  }

  return {
    success: true,
    authorized: true,
    session: authResult.session
  }
}

/**
 * Verify user owns the resource or is admin
 */
export async function requireOwnershipOrAdmin(
  resourceOwnerId: string
): Promise<AuthorizationResult> {
  const authResult = await requireAuth()
  
  if (!authResult.success || !authResult.session) {
    return {
      ...authResult,
      authorized: false
    }
  }

  const userId = authResult.session.user.id
  const userRole = authResult.session.user.role
  const isOwner = resourceOwnerId === userId
  const isAdmin = userRole === "ADMIN"

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      authorized: false,
      error: {
        message: "Forbidden - You don't have access to this resource",
        status: 403
      }
    }
  }

  return {
    success: true,
    authorized: true,
    session: authResult.session
  }
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<AuthorizationResult> {
  return requireRole(["ADMIN"])
}

/**
 * Check if user is provider
 */
export async function requireProvider(): Promise<AuthorizationResult> {
  return requireRole(["PROVIDER"])
}

/**
 * Check if user is seeker
 */
export async function requireSeeker(): Promise<AuthorizationResult> {
  return requireRole(["SEEKER"])
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, session: Session, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    const authResult = await requireAuth()

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { error: authResult.error?.message || "Unauthorized" },
        { status: authResult.error?.status || 401 }
      ) as NextResponse<T>
    }

    return handler(request, authResult.session, ...args)
  }
}

/**
 * Higher-order function to wrap API routes with role-based authorization
 */
export function withRole<T = any>(
  allowedRoles: Array<"SEEKER" | "PROVIDER" | "ADMIN">,
  handler: (request: NextRequest, session: Session, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    const authResult = await requireRole(allowedRoles)

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { error: authResult.error?.message || "Forbidden" },
        { status: authResult.error?.status || 403 }
      ) as NextResponse<T>
    }

    return handler(request, authResult.session, ...args)
  }
}

/**
 * Utility to create error responses
 */
export function createAuthErrorResponse(authResult: AuthResult | AuthorizationResult): NextResponse {
  return NextResponse.json(
    { error: authResult.error?.message || "Unauthorized" },
    { status: authResult.error?.status || 401 }
  )
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

/**
 * Get current user role from session
 */
export async function getCurrentUserRole(): Promise<"SEEKER" | "PROVIDER" | "ADMIN" | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.role || null
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "ADMIN"
}

