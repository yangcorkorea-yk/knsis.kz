import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  // Disable PWA in development to keep HMR clean.
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    // Default workbox config = StaleWhileRevalidate for navigations
    // + CacheFirst for hashed assets. Decision E2 of the M0 PR.
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
};

export default withPWA(withNextIntl(nextConfig));
