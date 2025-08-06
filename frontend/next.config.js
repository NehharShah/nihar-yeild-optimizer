/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    domains: ['via.placeholder.com'],
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
  env: {
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x9094E827F56c1a19666B9D33790bFf0678868685',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',
    NEXT_PUBLIC_SEGMENT_WRITE_KEY: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '',
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  },
}

module.exports = nextConfig