/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Optimize for production
  serverExternalPackages: ["@prisma/client"],

  // Fix for Next.js 15 app router build issues
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },

  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    XENDIT_API_KEY: process.env.XENDIT_API_KEY,
    NEXT_PUBLIC_XENDIT_CLIENT_KEY: process.env.NEXT_PUBLIC_XENDIT_CLIENT_KEY,
  },

  // Disable static optimization for API routes
  generateBuildId: async () => {
    return "build-cache-" + Date.now();
  },
};

export default nextConfig;
