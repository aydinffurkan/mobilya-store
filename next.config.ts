import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection',       value: '1; mode=block' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS — only activate in production (localhost HTTPS isn't set up)
  ...(process.env.NODE_ENV === 'production' ? [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ] : []),
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    // Vercel Image Optimization kotası (402) yerine ücretsiz weserv CDN.
    // remotePatterns custom loader ile yok sayılır ama izin verilen kaynakları
    // belgelemek için tutuyoruz.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    qualities: [75, 95],
    remotePatterns: [
      { protocol: 'https', hostname: 'jdslkatkywtdbaqoaotm.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
