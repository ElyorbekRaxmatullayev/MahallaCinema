import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/cinema',
  serverExternalPackages: ["@prisma/client", "pg"],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
