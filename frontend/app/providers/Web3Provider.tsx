'use client'

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// 1. Get projectId from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

// 2. Create wagmiConfig
const metadata = {
  name: 'USDC Yield Optimizer',
  description: 'Optimize your USDC yield across multiple protocols',
  url: 'https://your-domain.com',
  icons: ['https://your-domain.com/logo.png']
}

const chains = [base, baseSepolia]
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({ 
  wagmiConfig, 
  projectId, 
  chains,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-background': '#ffffff',
  }
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      {children}
    </WagmiConfig>
  )
}