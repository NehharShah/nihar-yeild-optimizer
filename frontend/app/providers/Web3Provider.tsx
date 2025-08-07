'use client'

import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'wagmi/chains'
import { useEffect, useState } from 'react'

// 1. Get projectId from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Put Base Sepolia first to make it the default for our testnet deployment
const chains = [baseSepolia, base]

// 3. Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

// Create a bulletproof wagmi configuration with multiple fallback strategies
function createWagmiConfig() {
  // Strategy 1: Try full configuration with configureChains
  try {
    console.log('Attempting full wagmi configuration...')
    const { chains: configuredChains, publicClient, webSocketPublicClient } = configureChains(
      chains,
      [publicProvider()],
    )

    const connectors: any[] = []
    
    // Try to add each connector individually with error handling
    try {
      connectors.push(new InjectedConnector({
        chains: configuredChains,
        options: {
          name: 'Injected',
          shimDisconnect: true,
        },
      }))
      console.log('✓ InjectedConnector added')
    } catch (e) {
      console.warn('InjectedConnector failed:', e)
    }

    try {
      connectors.push(new MetaMaskConnector({
        chains: configuredChains,
        options: {
          shimDisconnect: true,
        },
      }))
      console.log('✓ MetaMaskConnector added')
    } catch (e) {
      console.warn('MetaMaskConnector failed:', e)
    }

    // Only try WalletConnect if we have a valid project ID
    if (projectId && projectId !== 'demo-project-id') {
      try {
        connectors.push(new WalletConnectConnector({
          chains: configuredChains,
          options: {
            projectId,
            metadata: {
              name: 'USDC Yield Optimizer',
              description: 'Optimize your USDC yield across Aave, Morpho, and Moonwell on Base',
              url: 'https://nihar-yeild-optimizer.vercel.app',
              icons: ['https://nihar-yeild-optimizer.vercel.app/logo.png']
            },
          },
        }))
        console.log('✓ WalletConnectConnector added')
      } catch (e) {
        console.warn('WalletConnectConnector failed:', e)
      }
    }

    if (connectors.length === 0) {
      throw new Error('No connectors available')
    }

    const config = createConfig({
      autoConnect: true,
      connectors,
      publicClient,
      webSocketPublicClient,
    })
    
    console.log('✅ Full wagmi configuration successful')
    return config
    
  } catch (error) {
    console.error('Full configuration failed:', error)
    
    // Strategy 2: Try minimal configuration without configureChains
    try {
      console.log('Attempting minimal wagmi configuration...')
      
      // Create minimal connectors
      const connectors: any[] = []
      
      try {
        connectors.push(new InjectedConnector({
          chains: [baseSepolia, base],
          options: {
            name: 'Browser Wallet',
            shimDisconnect: true,
          },
        }))
      } catch (e) {
        console.warn('Minimal InjectedConnector failed:', e)
      }

      if (connectors.length === 0) {
        throw new Error('Even minimal connectors failed')
      }

      // Create very basic config with minimal public client
      const minimalConfig = createConfig({
        autoConnect: false, // Don't auto-connect to avoid issues
        connectors,
        publicClient: createPublicClient({
          chain: baseSepolia,
          transport: http('https://sepolia.base.org'),
        }) as any, // Type coercion to handle version compatibility
      })
      
      console.log('✅ Minimal wagmi configuration successful')
      return minimalConfig
      
    } catch (minimalError) {
      console.error('Even minimal configuration failed:', minimalError)
      return null
    }
  }
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    // Always try to create config on client side
    if (typeof window !== 'undefined') {
      console.log('🔧 Initializing Web3 Provider...')
      const wagmiConfig = createWagmiConfig()
      if (wagmiConfig) {
        console.log('✅ Web3 Provider initialized successfully')
        setConfig(wagmiConfig)
        setInitError(null)
      } else {
        console.error('❌ Web3 Provider initialization failed')
        setInitError('Failed to initialize wagmi configuration')
        setConfig(null)
      }
    } else {
      // SSR: just set ready without config
      console.log('🖥️ Server-side rendering mode')
    }
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading Web3...
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {config ? (
        <WagmiConfig config={config}>
          {children}
        </WagmiConfig>
      ) : (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-8">
          <div className="max-w-lg text-center">
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Debugging Web3 Configuration</h1>
            <div className="text-gray-600 mb-6">
              The wagmi configuration is failing to initialize. <br/>
              Let's debug this step by step.
            </div>
            
            {/* Debug Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">🔍 Debug Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Browser:</span> {typeof window !== 'undefined' ? '✅ Client-side' : '❌ Server-side'}
                </div>
                <div>
                  <span className="font-medium">Ethereum:</span> {typeof window !== 'undefined' && (window as any).ethereum ? '✅ Detected' : '❌ Not found'}
                </div>
                <div>
                  <span className="font-medium">MetaMask:</span> {typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask ? '✅ Installed' : '❌ Not detected'}
                </div>
                <div>
                  <span className="font-medium">Project ID:</span> {projectId !== 'demo-project-id' ? '✅ Set' : '⚠️ Using demo'}
                </div>
                {initError && (
                  <div>
                    <span className="font-medium text-red-600">Error:</span> {initError}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-blue-800 text-sm">
                <strong>🛠️ Please do this:</strong><br/>
                1. Open browser Developer Tools (F12)<br/>
                2. Go to the Console tab<br/>
                3. Click "Refresh Page" below<br/>
                4. Look for detailed error messages in the console
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  console.clear()
                  window.location.reload()
                }} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Refresh Page & Clear Console
              </button>
              
              <button 
                onClick={() => {
                  console.clear()
                  console.log('🔧 Manual wagmi configuration test...')
                  const testConfig = createWagmiConfig()
                  console.log('Result:', testConfig)
                  if (testConfig) {
                    setConfig(testConfig)
                    setInitError(null)
                  }
                }} 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                🧪 Try Manual Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  )
}