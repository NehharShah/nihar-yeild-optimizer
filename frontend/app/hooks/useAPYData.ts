'use client'

import { useContractReads } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { APYData } from '../components/APYTable'

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`

const vaultABI = [
  {
    inputs: [{ name: 'protocol', type: 'uint8' }],
    name: 'getProtocolAPY',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'activeProtocol',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useAPYData() {
  // Get on-chain APY data
  const { data: contractData, isLoading: contractLoading } = useContractReads({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'activeProtocol',
      },
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'getProtocolAPY',
        args: [0], // AAVE
      },
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'getProtocolAPY',
        args: [1], // MORPHO
      },
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'getProtocolAPY',
        args: [2], // MOONWELL
      },
    ],
    enabled: !!VAULT_ADDRESS,
    watch: true,
    cacheTime: 30_000, // 30 seconds
  })

  // Get off-chain APY data as fallback/supplement
  const { data: offChainData, isLoading: offChainLoading } = useQuery({
    queryKey: ['apyData'],
    queryFn: async (): Promise<{
      aave: { apy: number; tvl: string; change24h: number }
      morpho: { apy: number; tvl: string; change24h: number }  
      moonwell: { apy: number; tvl: string; change24h: number }
    }> => {
      // In production, this would call DeFi APIs
      // For now, return mock data with realistic values
      return {
        aave: {
          apy: 350 + Math.random() * 100, // 3.5-4.5%
          tvl: '12.5M',
          change24h: (Math.random() - 0.5) * 20, // -10 to +10 bps
        },
        morpho: {
          apy: 420 + Math.random() * 100, // 4.2-5.2%
          tvl: '8.7M', 
          change24h: (Math.random() - 0.5) * 30, // -15 to +15 bps
        },
        moonwell: {
          apy: 380 + Math.random() * 80, // 3.8-4.6%
          tvl: '5.2M',
          change24h: (Math.random() - 0.5) * 25, // -12.5 to +12.5 bps
        },
      }
    },
    refetchInterval: 60_000, // 1 minute
    staleTime: 30_000, // 30 seconds
  })

  const processAPYData = (): APYData[] => {
    const protocols: APYData[] = []

    // Use on-chain data if available, otherwise fall back to off-chain
    if (contractData && offChainData) {
      protocols.push({
        protocol: 'AAVE',
        apy: contractData[1]?.result ? Number(contractData[1].result) : offChainData.aave.apy,
        change24h: offChainData.aave.change24h,
        tvl: offChainData.aave.tvl,
        protocolId: 0,
      })

      protocols.push({
        protocol: 'MORPHO',
        apy: contractData[2]?.result ? Number(contractData[2].result) : offChainData.morpho.apy,
        change24h: offChainData.morpho.change24h,
        tvl: offChainData.morpho.tvl,
        protocolId: 1,
      })

      protocols.push({
        protocol: 'MOONWELL',
        apy: contractData[3]?.result ? Number(contractData[3].result) : offChainData.moonwell.apy,
        change24h: offChainData.moonwell.change24h,
        tvl: offChainData.moonwell.tvl,
        protocolId: 2,
      })
    } else if (offChainData) {
      // Fallback to off-chain only
      protocols.push(
        {
          protocol: 'AAVE',
          apy: offChainData.aave.apy,
          change24h: offChainData.aave.change24h,
          tvl: offChainData.aave.tvl,
          protocolId: 0,
        },
        {
          protocol: 'MORPHO',
          apy: offChainData.morpho.apy,
          change24h: offChainData.morpho.change24h,
          tvl: offChainData.morpho.tvl,
          protocolId: 1,
        },
        {
          protocol: 'MOONWELL',
          apy: offChainData.moonwell.apy,
          change24h: offChainData.moonwell.change24h,
          tvl: offChainData.moonwell.tvl,
          protocolId: 2,
        }
      )
    }

    return protocols.sort((a, b) => b.apy - a.apy) // Sort by highest APY first
  }

  return {
    apyData: processAPYData(),
    activeProtocol: contractData?.[0]?.result ? Number(contractData[0].result) : 0,
    isLoading: contractLoading || offChainLoading,
  }
}

// Hook for historical APY data
export function useHistoricalAPY() {
  return useQuery({
    queryKey: ['historicalAPY'],
    queryFn: async () => {
      // This would fetch historical APY data from subgraphs or APIs
      // For now, return mock data
      const days = 30
      const data = []
      
      for (let i = days; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        data.push({
          date: date.toISOString().split('T')[0],
          aave: 3.5 + Math.sin(i * 0.1) * 0.5,
          morpho: 4.2 + Math.sin(i * 0.15) * 0.8,  
          moonwell: 3.8 + Math.sin(i * 0.12) * 0.6,
        })
      }
      
      return data
    },
    staleTime: 300_000, // 5 minutes
  })
}