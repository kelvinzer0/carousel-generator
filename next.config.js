/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent full reloads via WebSocket reconnection over tunnel
  reactStrictMode: false,
  // Disable server-side rendering for pure SPA
  // This prevents any ? query from causing server round-trips
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui'],
  },
  // Disable automatic static optimization
  // This prevents Next.js from doing full reloads on route changes
  poweredByHeader: false,
  // Standalone output for Docker
  output: 'standalone',
};

module.exports = nextConfig;
