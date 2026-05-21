import type { NextConfig } from "next";

const imageHostnames = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
  .split(",")
  .map((hostname) => hostname.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Performance: Optimize package imports
  experimental: {
    optimizePackageImports: ["zod", "jose"],
  },

  // Only explicitly approved hosts use next/image optimization.
  // Arbitrary admin-entered image URLs render through a plain <img> fallback.
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },

  // Performance: Enable React strict mode for better development practices
  reactStrictMode: true,

  // Performance: Disable x-powered-by header (also reduces response size)
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Content Security Policy
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
              "style-src 'self' 'unsafe-inline'", // Required for inline styles
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
