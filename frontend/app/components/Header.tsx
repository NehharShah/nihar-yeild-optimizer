'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { Wallet, LogOut, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only showing wallet UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YieldOptim</h1>
              <p className="text-sm text-gray-500">USDC on Base</p>
            </div>
          </div>

          {/* Wallet Connection */}
          {mounted ? (
            isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">
                    Base Sepolia Testnet
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 bg-primary-50 px-4 py-2 rounded-lg">
                  <Wallet className="w-4 h-4 text-primary-600" />
                  <span className="font-mono text-sm text-primary-700">
                    {formatAddress(address!)}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="p-1 hover:bg-primary-100 rounded transition-colors"
                    title="Disconnect"
                  >
                    <LogOut className="w-4 h-4 text-primary-600" />
                  </button>
                </div>
              </div>
            ) : (
              <w3m-button />
            )
          ) : (
            // Loading placeholder to prevent layout shift
            <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          )}
        </div>
      </div>
    </header>
  )
}