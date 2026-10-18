/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // désactivé en dev
  runtimeCaching: [
    // ── Pages et assets statiques ─────────────────────────────────────────
    {
      urlPattern: /^https:\/\/mtechbenin\.com\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/mtechbenin\.com\/_next\/image\?.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-images",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // ── Images Cloudinary ─────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cloudinary-images",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // ── API backend ───────────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/mtechbenin-backend\.onrender\.com\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    // ── Fonts Google ──────────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "google-fonts-stylesheets" },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.youcan.shop" },
      { protocol: "https", hostname: "assets.youcan.shop" },
      { protocol: "https", hostname: "images.unsplash.com" },
{ protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
    ],
  },
};

export default pwaConfig(nextConfig);
