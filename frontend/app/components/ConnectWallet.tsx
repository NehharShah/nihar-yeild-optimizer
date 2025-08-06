'use client'

import { Wallet, Shield, Zap, TrendingUp } from 'lucide-react'

export function ConnectWallet() {
  return (
    <div className="space-y-12">
      <div className="bg-white p-8 rounded-2xl card-shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-4">
            Start optimizing your USDC yield on Base Sepolia testnet
          </p>
          
          {/* Testnet Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">Base Sepolia Testnet</span>
            </div>
            <p className="text-sm text-blue-800">
              🧪 This is a testnet deployment. Get free Base Sepolia ETH from{' '}
              <a 
                href="https://portal.cdp.coinbase.com/products/faucet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                Coinbase Faucet
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <w3m-button />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Auto-Optimization
          </h3>
          <p className="text-gray-600">
            Automatically rebalances between Aave, Morpho, and Moonwell for maximum yield
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Account Abstraction
          </h3>
          <p className="text-gray-600">
            Uses Safe wallets with session keys for secure automated transactions
          </p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Real-time Tracking
          </h3>
          <p className="text-gray-600">
            Monitor your yield earnings and APY changes across all protocols
          </p>
        </div>
      </div>

      {/* Protocol Logos */}
      <div className="bg-white p-6 rounded-xl card-shadow">
        <h3 className="text-center text-sm font-medium text-gray-500 mb-4">
          SUPPORTED PROTOCOLS
        </h3>
        <div className="flex justify-center items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Aave</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Morpho</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"></div>
            <span className="font-medium text-gray-700">Moonwell</span>
          </div>
        </div>
      </div>
    </div>
  )
}