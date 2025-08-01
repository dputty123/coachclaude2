import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore these directories during production builds
    ignoreDuringBuilds: false, // Keep linting enabled
    dirs: ['src/app', 'src/components', 'src/lib'], // Only lint these directories
  },
};

export default nextConfig;
