'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useHistoricalYield } from '../hooks/useVaultData'
import { useHistoricalAPY } from '../hooks/useAPYData'

interface YieldChartProps {
  userAddress?: string
}

export function YieldChart({ userAddress }: YieldChartProps) {
  const { data: yieldData, isLoading: yieldLoading } = useHistoricalYield(userAddress)
  const { data: apyData, isLoading: apyLoading } = useHistoricalAPY()

  const isLoading = yieldLoading || apyLoading

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 card-shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Yield Performance</h2>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-gray-500">Loading chart...</span>
        </div>
      </div>
    )
  }

  // Combine yield and APY data
  const chartData = yieldData?.map((yieldPoint, index) => {
    const apyPoint = apyData?.[index]
    return {
      date: new Date(yieldPoint.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      yield: yieldPoint.yield,
      aave: apyPoint?.aave || 0,
      morpho: apyPoint?.morpho || 0,
      moonwell: apyPoint?.moonwell || 0,
    }
  }) || []

  return (
    <div className="bg-white rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Yield Performance</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Your Yield ($)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Aave APY (%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Morpho APY (%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-600">Moonwell APY (%)</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="yield"
              orientation="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              yAxisId="apy"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 'medium' }}
              formatter={(value: any, name: string) => {
                if (name === 'yield') {
                  return [`$${Number(value).toFixed(2)}`, 'Your Yield']
                }
                return [`${Number(value).toFixed(2)}%`, name.charAt(0).toUpperCase() + name.slice(1) + ' APY']
              }}
            />
            
            {/* Yield line */}
            <Line
              yAxisId="yield"
              type="monotone"
              dataKey="yield"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#22c55e' }}
            />
            
            {/* APY lines */}
            <Line
              yAxisId="apy"
              type="monotone"
              dataKey="aave"
              stroke="#a855f7"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#a855f7' }}
            />
            <Line
              yAxisId="apy"
              type="monotone"
              dataKey="morpho"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#3b82f6' }}
            />
            <Line
              yAxisId="apy"
              type="monotone"
              dataKey="moonwell"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Chart shows:</span> Your accumulated yield in USD (solid green line) 
          and historical APY rates for each protocol (dashed lines). The optimizer automatically moves 
          your funds to capture the best available rates.
        </p>
      </div>
    </div>
  )
}