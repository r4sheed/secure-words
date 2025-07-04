import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/password-generator',
  assetPrefix: '/password-generator/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
