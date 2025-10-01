import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SEEKER" | "PROVIDER" | "ADMIN"
      status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: "SEEKER" | "PROVIDER" | "ADMIN"
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: "SEEKER" | "PROVIDER" | "ADMIN"
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"
  }
}

