import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.DEV_ORIGIN
    ? process.env.DEV_ORIGIN.split(",")
    : [],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
