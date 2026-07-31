import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow product photo uploads through server actions (~2.5 MB images)
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
