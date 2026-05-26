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
    // Navigation requests = HTML pages. The default workbox runtime
    // (StaleWhileRevalidate) serves cached HTML first and revalidates
    // in the background — so the user sees yesterday's build on the
    // first paint of every page after a deploy. PR #8 M2-04 sign-off
    // caught this: the d83d231 nested-<main> fix shipped but mobile
    // users kept seeing the broken layout until a second navigation.
    //
    // NetworkFirst with a 4s timeout serves the fresh build whenever
    // the network is reachable, falling back to cache only when the
    // network is offline or slow. The trade-off is a slightly slower
    // first paint for repeat visitors on fast networks; the win is
    // that deploys take effect immediately.
    //
    // Hashed assets (CSS / JS / fonts) keep workbox's default
    // CacheFirst behaviour — file-name hashing makes that safe.
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
    ],
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
