import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Smaller production image for Docker / self-hosting
  output: "standalone",
  // Allow product photo uploads through server actions (~2.5 MB images)
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Skip source map upload when auth token is not set (local / Render free)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
