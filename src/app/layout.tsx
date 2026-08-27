import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/common/Footer";
import AnimatedBackground from "@/components/common/AnimatedBackground";
import Navbar from "@/components/common/Navbar";
import localFont from "next/font/local";
import { metaDataBase } from "@/data/metaData";
import {
  organizationStructuredData,
  websiteStructuredData,
} from "@/data/structuredData";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import DeviatorsStickers from "@/components/common/DeviatorsStickers";

const zalandoSans = localFont({
  src: [
    {
      path: "../fonts/zalando-sans-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../fonts/zalando-sans-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  preload: true,
  variable: "--font-sans",
});

const zalandoSansExpanded = localFont({
  src: [
    {
      path: "../fonts/zalando-sans-expanded-latin-wght-normal.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../fonts/zalando-sans-expanded-latin-wght-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  preload: true,
  variable: "--font-heading",
});

export const metadata: Metadata = {
  ...metaDataBase,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020817",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${zalandoSans.variable} ${zalandoSansExpanded.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AnimatedBackground />
        <Navbar />
        {children}
        <Footer />
        <DeviatorsStickers />
        {process.env.NODE_ENV === "production" && <Analytics />}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}
