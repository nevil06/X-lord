import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to the Express backend to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
