import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // Allow the app to work on any hosting platform
  output: "standalone",
};

export default nextConfig;
