import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile avatars
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.16"],
};

export default nextConfig;
