/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: Setting this to false will disable linting during builds
    ignoreDuringBuilds: false,
  },
  // Enable developer warnings for hydration issues
  onDemandEntries: {
    // Make warnings more noticeable in development
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
