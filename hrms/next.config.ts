import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  reactStrictMode: true,
  serverExternalPackages: ["pg", "bcryptjs"],
  poweredByHeader: false,
};

export default nextConfig;
