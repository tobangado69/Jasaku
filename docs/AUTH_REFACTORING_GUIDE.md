# Authentication Refactoring Guide

## Overview

This guide explains the refactored authentication system and how to use it effectively in your application.

## What's New

### ✅ Type Safety
- Full TypeScript support with proper NextAuth type augmentation
- No more `any` types for user session data
- Strongly typed role-based access control

### ✅ Reusable Utilities
- Server-side middleware for API routes
- Client-side hooks with consistent patterns
- Higher-order components for page protection

### ✅ Better Security
- Account status checking (ACTIVE, INACTIVE, SUSPENDED, etc.)
- Last login tracking
- Session configuration with proper expiry
- Comprehensive error handling

### ✅ DRY Principle
- Eliminated code duplication across API routes
- Centralized auth logic
- Consistent error responses

## File Structure

```
lib/
├── auth.ts                    # NextAuth configuration
└── auth/
    ├── index.ts              # Centralized exports
    └── middleware.ts         # Server-side auth utilities

types/
└── next-auth.d.ts            # TypeScript type augmentation

hooks/
└── useAuth.ts                # Client-side auth hooks

components/
└── auth/
    └── withAuth.tsx          # HOC components
```

## Server-Side Usage (API Routes)

### Basic Authentication

```typescript
import { requireAuth, createAuthErrorResponse } from "@/lib/auth/middleware"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()
  
  if (!authResult.success || !authResult.session) {
    return createAuthErrorResponse(authResult)
  }

  const { user } = authResult.session
  // user.id, user.role, user.email are all typed!
  
  // Your logic here
  return NextResponse.json({ data: "..." })
}
```

### Role-Based Authorization

```typescript
import { requireRole, createAuthErrorResponse } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  // Only allow SEEKER role
  const authResult = await requireRole(["SEEKER"])
  
  if (!authResult.success || !authResult.session) {
    return createAuthErrorResponse(authResult)
  }

  const { user } = authResult.session
  // user.role is guaranteed to be "SEEKER" here
  
  // Your logic here
}
```

### Multiple Roles

```typescript
// Allow both PROVIDER and ADMIN
const authResult = await requireRole(["PROVIDER", "ADMIN"])
```

### Ownership Check

```typescript
import { requireOwnershipOrAdmin } from "@/lib/auth/middleware"

export async function PATCH(request: NextRequest) {
  const resourceOwnerId = "user-123"
  
  const authResult = await requireOwnershipOrAdmin(resourceOwnerId)
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult)
  }
  
  // User is either the owner or an admin
}
```

### Using Higher-Order Functions

```typescript
import { withAuth, withRole } from "@/lib/auth/middleware"

// Wrap handler with auth
export const GET = withAuth(async (request, session) => {
  // session is guaranteed to exist
  const userId = session.user.id
  
  return NextResponse.json({ userId })
})

// Wrap handler with role check
export const POST = withRole(["SEEKER"], async (request, session) => {
  // session.user.role is guaranteed to be "SEEKER"
  
  return NextResponse.json({ success: true })
})
```

### Convenience Functions

```typescript
import { 
  requireAdmin, 
  requireProvider, 
  requireSeeker,
  getCurrentUserId,
  getCurrentUserRole,
  isCurrentUserAdmin
} from "@/lib/auth/middleware"

// Quick role checks
const adminResult = await requireAdmin()
const providerResult = await requireProvider()
const seekerResult = await requireSeeker()

// Get current user info
const userId = await getCurrentUserId()
const userRole = await getCurrentUserRole()
const isAdmin = await isCurrentUserAdmin()
```

## Client-Side Usage (Components & Pages)

### Basic Authentication Hook

```typescript
import { useAuth } from "@/hooks/useAuth"

export default function MyComponent() {
  const { user, isAuthenticated, isLoading, logout, hasRole, isAdmin } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <p>Role: {user?.role}</p>
      {isAdmin && <p>You are an admin!</p>}
      {hasRole("PROVIDER") && <p>You are a provider!</p>}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Require Authentication

```typescript
import { useRequireAuth } from "@/hooks/useAuth"

export default function ProtectedPage() {
  const { user, isLoading } = useRequireAuth()
  // Automatically redirects to /auth/signin if not authenticated

  if (isLoading) return <div>Loading...</div>

  return <div>Welcome {user?.name}</div>
}
```

### Role Guard Hook

```typescript
import { useRoleGuard } from "@/hooks/useAuth"

export default function ProviderOnlyPage() {
  const { user, isLoading, hasAccess } = useRoleGuard("PROVIDER")
  // Automatically redirects to /unauthorized if wrong role

  if (isLoading) return <div>Loading...</div>

  return <div>Provider Dashboard</div>
}

// Multiple roles
export default function MultiRolePage() {
  const { user, hasAccess } = useRoleGuard(["PROVIDER", "ADMIN"])
  
  if (!hasAccess) return null
  
  return <div>Content</div>
}
```

### Convenience Role Hooks

```typescript
import { useAdminGuard, useProviderGuard, useSeekerGuard } from "@/hooks/useAuth"

// Admin only
export default function AdminPage() {
  const { user } = useAdminGuard()
  return <div>Admin Dashboard</div>
}

// Provider only
export default function ProviderPage() {
  const { user } = useProviderGuard()
  return <div>Provider Dashboard</div>
}

// Seeker only
export default function SeekerPage() {
  const { user } = useSeekerGuard()
  return <div>Seeker Dashboard</div>
}
```

### Higher-Order Components (HOC)

```typescript
import { withAuth, withAdminAuth, withProviderAuth } from "@/components/auth/withAuth"

// Protect entire page component
function MyProtectedPage() {
  return <div>Protected Content</div>
}

export default withAuth(MyProtectedPage)

// Admin only page
function AdminPage() {
  return <div>Admin Only</div>
}

export default withAdminAuth(AdminPage)

// Provider only page
function ProviderPage() {
  return <div>Provider Only</div>
}

export default withProviderAuth(ProviderPage)

// Multiple roles
import { withMultiRoleAuth } from "@/components/auth/withAuth"

function DashboardPage() {
  return <div>Dashboard</div>
}

export default withMultiRoleAuth(["PROVIDER", "ADMIN"])(DashboardPage)
```

## Migration Guide

### Before (Old Pattern)

```typescript
// ❌ Old way - lots of `any` types and duplication
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== "PROVIDER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const userId = (session.user as any)?.id
  // ...
}
```

### After (New Pattern)

```typescript
// ✅ New way - type-safe and clean
export async function GET(request: NextRequest) {
  const authResult = await requireRole(["PROVIDER"])
  
  if (!authResult.success || !authResult.session) {
    return createAuthErrorResponse(authResult)
  }

  const { user } = authResult.session
  // user.id and user.role are properly typed!
  // ...
}

// Or even cleaner with HOF:
export const GET = withRole(["PROVIDER"], async (request, session) => {
  const userId = session.user.id // fully typed!
  // ...
})
```

## Best Practices

### 1. Always Use Type-Safe Methods

```typescript
// ❌ Don't do this
const userId = (session.user as any)?.id

// ✅ Do this
const { user } = authResult.session
const userId = user.id // TypeScript knows this is a string
```

### 2. Use Appropriate Auth Level

```typescript
// ❌ Don't check role manually when you can use requireRole
const authResult = await requireAuth()
if (authResult.session?.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// ✅ Use the right utility
const authResult = await requireRole(["ADMIN"])
if (!authResult.success) {
  return createAuthErrorResponse(authResult)
}
```

### 3. Centralized Error Handling

```typescript
// ❌ Don't create error responses manually
if (!authResult.success) {
  return NextResponse.json({ 
    error: authResult.error?.message 
  }, { 
    status: authResult.error?.status 
  })
}

// ✅ Use the utility
if (!authResult.success) {
  return createAuthErrorResponse(authResult)
}
```

### 4. Prefer Higher-Order Functions for Simple Cases

```typescript
// ✅ Clean and declarative
export const GET = withRole(["SEEKER"], async (request, session) => {
  // Your logic
})

// Instead of:
export async function GET(request: NextRequest) {
  const authResult = await requireRole(["SEEKER"])
  if (!authResult.success) return createAuthErrorResponse(authResult)
  // Your logic
}
```

### 5. Use Return URL for Better UX

The `useRequireAuth` hook automatically includes a return URL when redirecting to sign-in:

```typescript
// User will be redirected back after signing in
const { user } = useRequireAuth()
```

## Testing

### Testing API Routes

```typescript
import { requireAuth } from "@/lib/auth/middleware"

// Mock the auth result in tests
jest.mock("@/lib/auth/middleware")

test("protected route", async () => {
  (requireAuth as jest.Mock).mockResolvedValue({
    success: true,
    session: {
      user: {
        id: "user-123",
        role: "SEEKER",
        email: "test@example.com",
      }
    }
  })

  // Test your route
})
```

### Testing Components

```typescript
import { useAuth } from "@/hooks/useAuth"

jest.mock("@/hooks/useAuth")

test("protected component", () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: { id: "123", role: "PROVIDER" },
    isAuthenticated: true,
    isLoading: false,
  })

  // Test your component
})
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing properties on `session.user`:

1. Make sure `types/next-auth.d.ts` exists
2. Restart your TypeScript server
3. Check your `tsconfig.json` includes the types folder

### Session Not Available

If `session` is undefined:

1. Check that SessionProvider wraps your app
2. Verify NextAuth is configured correctly
3. Check that the user is actually signed in

### Role Checks Failing

If role checks aren't working:

1. Verify the JWT callback in `lib/auth.ts` sets the role
2. Check the session callback passes it to the session
3. Ensure the database user has a valid role

## Summary

The refactored authentication system provides:

- **Type Safety**: Full TypeScript support, no more `any` types
- **Reusability**: DRY principles with reusable utilities
- **Consistency**: Standardized patterns across the app
- **Security**: Better account status checking and session management
- **Developer Experience**: Clean APIs, good error messages, comprehensive documentation

Use the appropriate tool for your use case:
- **API Routes**: Use `requireAuth`, `requireRole`, or HOF wrappers
- **Client Components**: Use hooks like `useAuth`, `useRoleGuard`
- **Page Protection**: Use HOCs like `withAuth`, `withAdminAuth`

