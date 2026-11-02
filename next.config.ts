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
        destination: "https://tinyurl.com/nexora-one",
        permanent: false,
      },
      {
        source: "/qr",
        destination: "https://tinyurl.com/nexora-one",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
