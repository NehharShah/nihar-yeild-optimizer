'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Bot, Shield, Settings, ExternalLink, AlertTriangle } from 'lucide-react'

export function AutoYieldToggle() {
  const { address } = useAccount()
  const [isAutoYieldEnabled, setIsAutoYieldEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleToggleAutoYield = async () => {
    setIsLoading(true)
    try {
      if (isAutoYieldEnabled) {
        // Disable auto-yield (revoke session key)
        console.log('Revoking session key...')
        // In production, this would interact with Safe or ZeroDev SDK
        await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
        setIsAutoYieldEnabled(false)
        alert('Auto-yield disabled successfully')
      } else {
        // Enable auto-yield (grant session key)
        console.log('Granting session key...')
        // In production, this would:
        // 1. Create session key for the keeper
        // 2. Set permissions (only rebalance function)
        // 3. Set spending limits and time limits
        await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
        setIsAutoYieldEnabled(true)
        alert('Auto-yield enabled successfully')
      }
    } catch (error) {
      console.error('Failed to toggle auto-yield:', error)
      alert('Failed to update auto-yield settings')
    }
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isAutoYieldEnabled ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Bot className={`w-5 h-5 ${
              isAutoYieldEnabled ? 'text-green-600' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Auto-Yield Optimization</h2>
            <p className="text-sm text-gray-500">
              Automatically rebalance to maximize your yield
            </p>
          </div>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isAutoYieldEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isAutoYieldEnabled ? 'Active' : 'Disabled'}
          </div>
          
          <button
            onClick={handleToggleAutoYield}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAutoYieldEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAutoYieldEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Rebalance Threshold</span>
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-blue-600">30 bps</p>
          <p className="text-xs text-blue-700">Minimum yield gain to trigger</p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900">Max Gas Cost</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-purple-600">10 bps</p>
          <p className="text-xs text-purple-700">Annual gas limit</p>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-900">Check Frequency</span>
            <Bot className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-orange-600">30 min</p>
          <p className="text-xs text-orange-700">Monitoring interval</p>
        </div>
      </div>

      {/* Security Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Security Features</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Session keys limited to rebalance function only</li>
              <li>• Daily spending cap equals your total vault balance</li>
              <li>• You can revoke automation permissions anytime</li>
              <li>• All rebalances are transparent and on-chain</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning for disabled state */}
      {!isAutoYieldEnabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Manual Mode Active</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Your funds are not being automatically rebalanced. You may miss out on better 
                yield opportunities across protocols.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>How it works</span>
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ↓
          </span>
        </button>

        {showDetails && (
          <div className="mt-3 space-y-3 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-900">1. Monitoring</h5>
              <p>Our keeper service monitors APY rates across Aave, Morpho, and Moonwell every 30 minutes.</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">2. Decision Making</h5>
              <p>When a better opportunity is found (≥30 bps gain, ≤10 bps gas cost), the keeper prepares a rebalance transaction.</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">3. Execution</h5>
              <p>Using your granted session key, the keeper executes the rebalance through your Safe wallet automatically.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <a href="#" className="text-blue-600 hover:underline">
                View transaction history
              </a>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">
              {isAutoYieldEnabled ? 'Disabling...' : 'Enabling...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}