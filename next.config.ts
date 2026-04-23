import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.14'],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
