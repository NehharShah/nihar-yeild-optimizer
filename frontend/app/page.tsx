'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Header } from './components/Header'
import { APYTable } from './components/APYTable'
import { VaultStats } from './components/VaultStats'
import { YieldChart } from './components/YieldChart'
import { DepositWithdraw } from './components/DepositWithdraw'

import { ConnectWallet } from './components/ConnectWallet'
import SafeWalletManager from './components/SafeWalletManager'

import { useVaultData } from './hooks/useVaultData'
import { useAPYData } from './hooks/useAPYData'

function HomePageContent() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'safe'>('overview')
  const [mounted, setMounted] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Set a timeout to show an error if loading takes too long
    const timeout = setTimeout(() => {
      setLoadingTimeout(true)
    }, 10000) // 10 seconds
    
    return () => clearTimeout(timeout)
  }, [])
  
  const { 
    balance,
    totalAssets,
    yieldEarned,
    isLoading: vaultLoading 
  } = useVaultData(address)

  const { 
    apyData,
    activeProtocol,
    isLoading: apyLoading 
  } = useAPYData()

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
            {loadingTimeout && (
              <div className="mt-4 text-center">
                <p className="text-red-600 text-sm">Loading is taking longer than expected.</p>
                <p className="text-gray-500 text-xs mt-1">Try refreshing the page or check your wallet connection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              USDC Yield Optimizer
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Automatically optimize your USDC yield across Aave, Morpho, and Moonwell on Base Sepolia.
              Connect your wallet to get started.
            </p>
            <ConnectWallet />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg mb-8 card-shadow">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'manage'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Manage Funds
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === 'safe'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            🛡️ Smart Wallet
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Vault Statistics */}
            <VaultStats
              balance={balance}
              totalAssets={totalAssets}
              yieldEarned={yieldEarned}
              isLoading={vaultLoading}
            />

            {/* APY Table */}
            <APYTable
              apyData={apyData}
              activeProtocol={activeProtocol}
              isLoading={apyLoading}
            />

            {/* Yield Chart */}
            <YieldChart userAddress={address} />
          </div>
        ) : activeTab === 'manage' ? (
          <div className="space-y-8">
            {/* Deposit/Withdraw Interface */}
            <DepositWithdraw
              userBalance={balance}
              vaultTotalAssets={totalAssets}
            />

            {/* Current Position Summary */}
            <VaultStats
              balance={balance}
              totalAssets={totalAssets}
              yieldEarned={yieldEarned}
              isLoading={vaultLoading}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Safe Wallet Management */}
            <SafeWalletManager />
          </div>
        )}
      </main>
    </div>
  )
}

export default function HomePage() {
  const [isWagmiReady, setIsWagmiReady] = useState(false)

  useEffect(() => {
    // Give wagmi a moment to initialize
    const timer = setTimeout(() => {
      setIsWagmiReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!isWagmiReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>🔄</div>
          <div>Initializing Yield Optimizer...</div>
        </div>
      </div>
    )
  }

  return <HomePageContent />
}