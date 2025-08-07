'use client'

import { getContractAddresses } from '../config/contracts'

// Segment Analytics Integration
interface SegmentEvent {
  userId?: string
  event: string
  properties: Record<string, any>
}

class AnalyticsService {
  private writeKey: string
  private isInitialized: boolean = false

  constructor() {
    this.writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || ''
    this.init()
  }

  private init() {
    if (typeof window === 'undefined' || !this.writeKey) return

    // Load Segment SDK
    const script = document.createElement('script')
    script.src = 'https://cdn.segment.com/analytics.js/v1/latest/analytics.min.js'
    script.onload = () => {
      // @ts-ignore
      window.analytics.load(this.writeKey)
      this.isInitialized = true
    }
    document.head.appendChild(script)
  }

  private getNetworkInfo(chainId?: number) {
    const contracts = getContractAddresses(chainId)
    const isTestnet = chainId === 84532 // Base Sepolia
    return {
      network: isTestnet ? 'base-sepolia' : 'base',
      chainId: chainId || 8453,
      isTestnet,
      vaultAddress: contracts.vaultAddress
    }
  }

  private track(event: SegmentEvent) {
    if (typeof window === 'undefined' || !this.isInitialized) {
      console.log('Analytics event (not initialized):', event)
      return
    }

    try {
      // @ts-ignore
      window.analytics.track(event.event, event.properties, {
        userId: event.userId
      })
    } catch (error) {
      console.error('Analytics error:', error)
    }
  }

  // Vault Events
  vaultDeposit(userId: string, amount: number, protocol: string, chainId?: number) {
    const networkInfo = this.getNetworkInfo(chainId)
    this.track({
      userId,
      event: 'vault_deposit',
      properties: {
        amount,
        protocol,
        timestamp: new Date().toISOString(),
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        isTestnet: networkInfo.isTestnet,
        vaultAddress: networkInfo.vaultAddress
      }
    })
  }

  vaultWithdraw(userId: string, amount: number, yieldEarned: number, chainId?: number) {
    const networkInfo = this.getNetworkInfo(chainId)
    this.track({
      userId,
      event: 'vault_withdraw',
      properties: {
        amount,
        yieldEarned,
        timestamp: new Date().toISOString(),
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        isTestnet: networkInfo.isTestnet,
        vaultAddress: networkInfo.vaultAddress
      }
    })
  }

  // Rebalancing Events
  rebalanceExecuted(
    fromProtocol: string,
    toProtocol: string,
    amount: number,
    apyGain: number,
    gasCost: number,
    chainId?: number
  ) {
    const networkInfo = this.getNetworkInfo(chainId)
    this.track({
      event: 'rebalance_executed',
      properties: {
        fromProtocol,
        toProtocol,
        amount,
        apyGain,
        gasCost,
        timestamp: new Date().toISOString(),
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        isTestnet: networkInfo.isTestnet,
        vaultAddress: networkInfo.vaultAddress,
        automated: true
      }
    })
  }

  // Yield Events
  yieldEarned(userId: string, amount: number, period: string, protocol: string) {
    this.track({
      userId,
      event: 'yield_earned',
      properties: {
        amount,
        period,
        protocol,
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  // Auto-Yield Events
  autoYieldToggled(userId: string, enabled: boolean) {
    this.track({
      userId,
      event: 'auto_yield_toggled',
      properties: {
        enabled,
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  // Session Key Events
  sessionKeyGranted(userId: string, permissions: string[]) {
    this.track({
      userId,
      event: 'session_key_granted',
      properties: {
        permissions,
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  sessionKeyRevoked(userId: string) {
    this.track({
      userId,
      event: 'session_key_revoked',
      properties: {
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  // APY Events
  apyDataFetched(protocols: Array<{name: string, apy: number}>) {
    this.track({
      event: 'apy_data_fetched',
      properties: {
        protocols,
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  // User Journey Events
  walletConnected(userId: string, walletType: string) {
    this.track({
      userId,
      event: 'wallet_connected',
      properties: {
        walletType,
        timestamp: new Date().toISOString(),
        network: 'base'
      }
    })
  }

  pageViewed(userId: string, page: string) {
    this.track({
      userId,
      event: 'page_viewed',
      properties: {
        page,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Error Events
  errorOccurred(userId: string, errorType: string, errorMessage: string, context?: any, chainId?: number) {
    const networkInfo = this.getNetworkInfo(chainId)
    this.track({
      userId,
      event: 'error_occurred',
      properties: {
        errorType,
        errorMessage,
        context,
        timestamp: new Date().toISOString(),
        network: networkInfo.network,
        chainId: networkInfo.chainId,
        isTestnet: networkInfo.isTestnet,
        vaultAddress: networkInfo.vaultAddress
      }
    })
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  return analytics
}

// Utility functions
export const trackVaultDeposit = (userId: string, amount: number, protocol: string, chainId?: number) => {
  analytics.vaultDeposit(userId, amount, protocol, chainId)
}

export const trackVaultWithdraw = (userId: string, amount: number, yieldEarned: number, chainId?: number) => {
  analytics.vaultWithdraw(userId, amount, yieldEarned, chainId)
}

export const trackRebalanceExecuted = (
  fromProtocol: string,
  toProtocol: string,
  amount: number,
  apyGain: number,
  gasCost: number,
  chainId?: number
) => {
  analytics.rebalanceExecuted(fromProtocol, toProtocol, amount, apyGain, gasCost, chainId)
}

export const trackYieldEarned = (userId: string, amount: number, period: string, protocol: string) => {
  analytics.yieldEarned(userId, amount, period, protocol)
}

export const trackAutoYieldToggled = (userId: string, enabled: boolean) => {
  analytics.autoYieldToggled(userId, enabled)
}

export const trackError = (userId: string, errorType: string, errorMessage: string, context?: any, chainId?: number) => {
  analytics.errorOccurred(userId, errorType, errorMessage, context, chainId)
}