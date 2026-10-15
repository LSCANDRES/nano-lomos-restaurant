import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nanolomos.cals.com.ar',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
