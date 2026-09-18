import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Font/logo PDF scheda tecnica: path assoluti sotto assets/ (non importati da TS).
  outputFileTracingIncludes: {
    "/api/products/[uuid]/scheda-tecnica": [
      "./assets/fonts/inter/**/*",
      "./assets/pdf/**/*",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Private-Network",
            value: "true",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "a.storyblok.com" }],
    qualities: [25, 50, 75, 80, 90, 100],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);
