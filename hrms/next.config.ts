import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg", "bcryptjs"],
  poweredByHeader: false,
};

export default nextConfig;
