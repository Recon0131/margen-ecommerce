import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@margen/ui'],
  output: 'standalone',
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])].join(' ');
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? '';
    const connectSrc = ["'self'", 'http://localhost:3001', 'http://127.0.0.1:3001', ...(apiBase ? [apiBase] : [])].join(' ');
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://dummyjson.com https://cdn.dummyjson.com",
              "font-src 'self' data:",
              "connect-src " + connectSrc,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'X-XSS-Protection', value: '0' },
        ],
      },
    ];
  },
};

export default nextConfig;
