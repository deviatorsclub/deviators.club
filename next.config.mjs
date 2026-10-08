/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      "motion",
      "@hugeicons/react",
      "@hugeicons/core-free-icons",
      "react-icons",
      "photoswipe",
    ],
  },

  // Image optimization for better performance
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Compression for smaller bundle sizes
  compress: true,

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/:slug(debug-decrypt-3\\.0|debug-decrypt-3)/registration",
        destination: "/events/:slug/registration",
      },
      {
        source: "/:slug(debug-decrypt-3\\.0|debug-decrypt-3)/team/:teamName",
        destination: "/events/:slug/team/:teamName",
      },
      {
        source: "/:slug(debug-decrypt-3\\.0|debug-decrypt-3)",
        destination: "/events/:slug",
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/event/:slug*",
        destination: "/events/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
