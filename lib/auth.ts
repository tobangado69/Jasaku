import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * Authentication error messages
 */
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_INACTIVE: "Account is inactive",
  ACCOUNT_SUSPENDED: "Account has been suspended",
  PENDING_VERIFICATION: "Account is pending verification",
  MISSING_CREDENTIALS: "Email and password are required",
  AUTHENTICATION_FAILED: "Authentication failed"
} as const;

/**
 * Validates user credentials and returns user if valid
 */
async function validateCredentials(
  email: string, 
  password: string
): Promise<User | null> {
  try {
    // Import prisma here to avoid circular dependency
    const { prisma } = await import("@/lib/db");
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true, // Only for authentication
      }
    });

    if (!user || !user.password) {
      console.warn(`Authentication failed: User not found - ${email}`);
      return null;
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      console.warn(`Authentication failed: Account status is ${user.status} - ${email}`);
      return null;
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.warn(`Authentication failed: Invalid password - ${email}`);
      return null;
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(err => console.error("Failed to update last login:", err));

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role,
      status: user.status,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          console.warn("Authentication attempt with missing credentials");
          return null;
        }

        return validateCredentials(credentials.email, credentials.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SEEKER" | "PROVIDER" | "ADMIN";
        session.user.status = token.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect to sign-in page on error
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email} (${user.id})`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email} (${token.sub})`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};
