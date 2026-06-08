import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jdslkatkywtdbaqoaotm.supabase.co',
      },
    ],
  },
};

export default nextConfig;
