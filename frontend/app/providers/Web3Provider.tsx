'use client'

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'

// 1. Get projectId from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// 2. Create wagmiConfig - prioritize Base Sepolia for testnet deployment
const metadata = {
  name: 'USDC Yield Optimizer',
  description: 'Optimize your USDC yield across Aave, Morpho, and Moonwell on Base',
  url: 'https://usdc-yield-optimizer.vercel.app',
  icons: ['https://usdc-yield-optimizer.vercel.app/logo.png']
}

// Put Base Sepolia first to make it the default for our testnet deployment
const chains = [baseSepolia, base]
const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
})

// 3. Create query client
const queryClient = new QueryClient()

// 4. Create modal
createWeb3Modal({ 
  wagmiConfig, 
  projectId, 
  chains,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
  }
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig as any}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
}