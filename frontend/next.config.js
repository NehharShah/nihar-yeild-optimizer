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
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',
    NEXT_PUBLIC_SEGMENT_WRITE_KEY: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '',
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    NEXT_PUBLIC_PIMLICO_API_KEY: process.env.NEXT_PUBLIC_PIMLICO_API_KEY || '',
    NEXT_PUBLIC_SAFE_WALLET_FACTORY: process.env.NEXT_PUBLIC_SAFE_WALLET_FACTORY || '',
    NEXT_PUBLIC_SESSION_KEY_MANAGER: process.env.NEXT_PUBLIC_SESSION_KEY_MANAGER || '',
  },
}

module.exports = nextConfig