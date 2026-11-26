/** @type {import('next').NextConfig} */

const nextConfig = {
  async rewrites() {
    const backend = (process.env.API_PROXY_TARGET || "https://mtechbenin-backend-xp3i.onrender.com").replace(/\/$/, "");
    return [
      { source: "/apple-music/:token", destination: `${backend}/apple-music/:token` },
      { source: "/apple-access/:token", destination: `${backend}/apple-access/:token` },
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
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

export default nextConfig;
