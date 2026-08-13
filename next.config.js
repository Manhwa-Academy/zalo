/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' to enable API routes
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Only bundle node modules on server side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
