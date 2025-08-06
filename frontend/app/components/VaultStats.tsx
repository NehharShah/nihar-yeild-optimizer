'use client'

import { DollarSign, TrendingUp, Wallet, PieChart } from 'lucide-react'

interface VaultStatsProps {
  balance: number // User's share balance in USDC
  totalAssets: number // Total vault assets
  yieldEarned: number // Total yield earned by user
  isLoading: boolean
}

export function VaultStats({ balance, totalAssets, yieldEarned, isLoading }: VaultStatsProps) {
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatCompactUSD = (amount: number) => {
    if (amount >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount)
    }
    return formatUSD(amount)
  }

  const yieldPercentage = balance > 0 ? ((yieldEarned / balance) * 100) : 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl card-shadow animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Your Balance */}
      <div className="bg-white p-6 rounded-xl card-shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-500">Your Balance</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatUSD(balance)}
          </div>
          <p className="text-sm text-gray-500">
            Deposited + earned yield
          </p>
        </div>
      </div>

      {/* Yield Earned */}
      <div className="bg-white p-6 rounded-xl card-shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-500">Yield Earned</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-600">
            {formatUSD(yieldEarned)}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {yieldPercentage > 0 && '+'}
              {yieldPercentage.toFixed(2)}% total return
            </span>
          </div>
        </div>
      </div>

      {/* Total Vault Assets */}
      <div className="bg-white p-6 rounded-xl card-shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-500">Total TVL</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatCompactUSD(totalAssets)}
          </div>
          <p className="text-sm text-gray-500">
            All users combined
          </p>
        </div>
      </div>

      {/* Share Percentage */}
      <div className="bg-white p-6 rounded-xl card-shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-gray-500">Your Share</span>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {totalAssets > 0 ? ((balance / totalAssets) * 100).toFixed(3) : '0.000'}%
          </div>
          <p className="text-sm text-gray-500">
            Of total vault
          </p>
        </div>
      </div>
    </div>
  )
}