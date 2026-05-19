import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  allowedDevOrigins: process.env.DEV_ORIGIN ? process.env.DEV_ORIGIN.split(",") : [],
  experimental: {
    optimizePackageImports: ["next-intl", "swr"],
    instantNavigationDevToolsToggle: true,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
