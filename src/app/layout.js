import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import ScrollToTop from "@/components/layout/ScrollToTop";
import SplashScreen from "@/components/SplashScreen";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata = {
  title: {
    default: "MTECHBENIN — Écouteurs, Enceintes & Abonnements Digitaux",
    template: "%s | MTECHBENIN",
  },
  description:
    "Achetez les meilleurs écouteurs, enceintes Bluetooth et abonnements Netflix, Spotify, Apple Music au Bénin. Livraison express à Cotonou.",
  keywords: [
    "écouteurs bénin",
    "enceintes bluetooth cotonou",
    "netflix bénin",
    "spotify bénin",
    "mtechbenin",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MTECHBENIN",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      // apple-touch-icon.png renommé en icon-152x152.png
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "MTECHBENIN — Écouteurs, Enceintes & Abonnements Digitaux",
    description:
      "Achetez les meilleurs écouteurs, enceintes Bluetooth et abonnements Netflix, Spotify au Bénin.",
    url: "https://mtechbenin.com",
    siteName: "MTECHBENIN",
    locale: "fr_BJ",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA — iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="MTECHBENIN" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Windows */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-TileImage"
          content="/icons/icon-192x192.png"
        />

        {/* iOS splash + touch icon */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans bg-white text-gray-900 antialiased`}
      >
        <SplashScreen />
        <ScrollToTop />
        <MaintenanceGuard>{children}</MaintenanceGuard>
      </body>
      {/* <body className="global-blur">{children}</body> */}
    </html>
  );
}
