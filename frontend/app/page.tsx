'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Header } from './components/Header'
import { APYTable } from './components/APYTable'
import { VaultStats } from './components/VaultStats'
import { YieldChart } from './components/YieldChart'
import { DepositWithdraw } from './components/DepositWithdraw'
import { AutoYieldToggle } from './components/AutoYieldToggle'
import { ConnectWallet } from './components/ConnectWallet'
import { useVaultData } from './hooks/useVaultData'
import { useAPYData } from './hooks/useAPYData'

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview')
  
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
              Automatically optimize your USDC yield across Aave, Morpho, and Moonwell on Base.
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

            {/* Auto-Yield Toggle */}
            <AutoYieldToggle />
          </div>
        ) : (
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
        )}
      </main>
    </div>
  )
}