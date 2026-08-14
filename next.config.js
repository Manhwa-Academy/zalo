/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'export' to enable API routes
  images: {
    unoptimized: true,
  },
  compiler: {
    // Automatically strip all console.log in Production deployment (F12 clean)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
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
