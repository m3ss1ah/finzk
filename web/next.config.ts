import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // snarkjs triggers a Turbopack NFT panic — use webpack for production builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        readline: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
