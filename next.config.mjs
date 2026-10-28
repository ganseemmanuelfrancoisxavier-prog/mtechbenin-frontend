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
      urlPattern: /^https:\/\/(?:mtechbenin|mtechafrica)\.com\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/(?:mtechbenin|mtechafrica)\.com\/_next\/image\?.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-images",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // ── Images Cloudinary ─────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/image\/upload\/.*$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cloudinary-images",
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // Les vidéos peuvent peser plusieurs dizaines de mégaoctets. Le cache
    // applicatif ne doit pas les conserver en entier sur les appareils mobiles.
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/video\/upload\/.*$/i,
      handler: "NetworkOnly",
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
  async rewrites() {
    const backend = (process.env.API_PROXY_TARGET || "https://mtechbenin-backend-xp3i.onrender.com").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdsassets.apple.com" },
      { protocol: "https", hostname: "cdn.youcan.shop" },
      { protocol: "https", hostname: "assets.youcan.shop" },
      { protocol: "https", hostname: "images.unsplash.com" },
{ protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
    ],
  },
};

export default pwaConfig(nextConfig);
