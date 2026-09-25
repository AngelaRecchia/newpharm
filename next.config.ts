import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Font e logo della scheda: path assoluti, non importati da TS.
  // La chiave non usa [uuid]: in glob è una classe di caratteri e non matcha la route.
  outputFileTracingIncludes: {
    "/pages/api/products/**/*": [
      "./assets/fonts/inter/**/*",
      "./assets/pdf/**/*",
    ],
    "/api/products/**/*": [
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
