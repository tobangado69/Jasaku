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
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY:
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  },

  // Disable static optimization for API routes
  generateBuildId: async () => {
    return "build-cache-" + Date.now();
  },
};

export default nextConfig;
