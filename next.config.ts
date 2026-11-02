import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/store",
        destination: "https://nexora-one.vercel.app",
        permanent: false,
      },
      {
        source: "/qr",
        destination: "https://nexora-one.vercel.app",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
