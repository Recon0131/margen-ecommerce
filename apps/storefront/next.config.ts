import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@margen/ui'],
  output: 'standalone',
};

export default nextConfig;
