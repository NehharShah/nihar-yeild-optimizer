'use client'

import { TrendingUp, TrendingDown, Circle } from 'lucide-react'

export interface APYData {
  protocol: 'AAVE' | 'MORPHO' | 'MOONWELL'
  apy: number // basis points
  change24h: number // basis points change
  tvl: string
  protocolId: number
}

interface APYTableProps {
  apyData: APYData[]
  activeProtocol: number
  isLoading: boolean
}

export function APYTable({ apyData, activeProtocol, isLoading }: APYTableProps) {
  const formatAPY = (bps: number) => {
    return (bps / 100).toFixed(2) + '%'
  }

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'AAVE': return 'from-purple-500 to-pink-500'
      case 'MORPHO': return 'from-blue-500 to-cyan-500'
      case 'MOONWELL': return 'from-indigo-500 to-blue-600'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getProtocolBg = (protocol: string) => {
    switch (protocol) {
      case 'AAVE': return 'bg-purple-50 border-purple-200'
      case 'MORPHO': return 'bg-blue-50 border-blue-200'
      case 'MOONWELL': return 'bg-indigo-50 border-indigo-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current APY Rates</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-16 h-6 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Current APY Rates</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <span>Live rates</span>
        </div>
      </div>

      <div className="space-y-4">
        {apyData.map((data) => {
          const isActive = data.protocolId === activeProtocol
          const change24h = data.change24h

          return (
            <div
              key={data.protocol}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive 
                  ? getProtocolBg(data.protocol) + ' scale-[1.02]'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Protocol Icon */}
                  <div className={`w-10 h-10 bg-gradient-to-r ${getProtocolColor(data.protocol)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">
                      {data.protocol[0]}
                    </span>
                  </div>

                  {/* Protocol Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {data.protocol}
                      </h3>
                      {isActive && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">TVL: {data.tvl}</p>
                  </div>
                </div>

                {/* APY Info */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatAPY(data.apy)}
                  </div>
                  
                  {/* 24h Change */}
                  <div className="flex items-center justify-end space-x-1">
                    {change24h > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : change24h < 0 ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : null}
                    <span className={`text-sm font-medium ${
                      change24h > 0 ? 'text-green-600' : 
                      change24h < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {change24h > 0 && '+'}
                      {formatAPY(Math.abs(change24h))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Auto-optimization:</span> The keeper automatically rebalances 
          to the highest APY when the gain exceeds 30 basis points and gas costs are below 10 basis points.
        </p>
      </div>
    </div>
  )
}