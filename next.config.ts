import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.nhle.com" },
      { protocol: "https", hostname: "cdn.nba.com" },
      { protocol: "https", hostname: "www.mlbstatic.com" },
      { protocol: "https", hostname: "midfield.mlbstatic.com" },
    ],
  },
};

export default nextConfig;
