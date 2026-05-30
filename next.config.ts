import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking (belt-and-suspenders alongside CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak URL paths on cross-origin navigations
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year; extend to subdomains once DNS is stable
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable unused browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // CSP: Next.js App Router needs 'unsafe-inline' for RSC streaming scripts/styles.
  // Vercel Analytics sends beacons to vitals.vercel-insights.com.
  // frame-ancestors 'none' blocks framing at the CSP level.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "media-src 'self' https://mqyxc4xvodvuodmx.public.blob.vercel-storage.com",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

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
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
