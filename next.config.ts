import type { NextConfig } from "next";

/**
 * Heavy WebGL libs (pixi.js, lottie, rive) are dynamic-imported on the client.
 * We mark them server-external so Next doesn't try to SSR-bundle them.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pixi.js"],
  experimental: {
    optimizePackageImports: ["gsap", "framer-motion", "d3"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
