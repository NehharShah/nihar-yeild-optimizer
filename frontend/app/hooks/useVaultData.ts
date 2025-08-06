'use client'

import { useContractRead, useContractReads } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'

const VAULT_ADDRESS = '0x9094E827F56c1a19666B9D33790bFf0678868685' as `0x${string}` // New fixed vault

const vaultABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'principalDeposited',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getYieldEarned',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useVaultData(userAddress?: `0x${string}`) {
  const { data: contractData, isLoading: contractLoading } = useContractReads({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'totalAssets',
      },
      ...(userAddress ? [
        {
          address: VAULT_ADDRESS,
          abi: vaultABI,
          functionName: 'balanceOf',
          args: [userAddress],
        },
        {
          address: VAULT_ADDRESS,
          abi: vaultABI,
          functionName: 'getYieldEarned',
          args: [userAddress],
        },
        {
          address: VAULT_ADDRESS,
          abi: vaultABI,
          functionName: 'principalDeposited',
          args: [userAddress],
        },
      ] : []),
    ],
    enabled: !!VAULT_ADDRESS,
    watch: true,
    cacheTime: 10_000, // 10 seconds
  })

  const processedData = {
    totalAssets: contractData?.[0]?.result ? 
      parseFloat(ethers.formatUnits(contractData[0].result, 6)) : 0, // USDC has 6 decimals
    
    shareBalance: userAddress && contractData?.[1]?.result ? 
      parseFloat(ethers.formatUnits(contractData[1].result, 18)) : 0, // Vault shares have 18 decimals
    
    yieldEarned: userAddress && contractData?.[2]?.result ? 
      parseFloat(ethers.formatUnits(contractData[2].result, 6)) : 0,
    
    principalDeposited: userAddress && contractData?.[3]?.result ? 
      parseFloat(ethers.formatUnits(contractData[3].result, 6)) : 0,
  }

  // Debug logging (only once per user)
  if (userAddress && contractData && !window.vaultDebugLogged) {
    console.log('🏦 Vault Data Debug:', {
      vaultAddress: VAULT_ADDRESS,
      userAddress,
      totalAssetsRaw: contractData[0]?.result?.toString(),
      shareBalanceRaw: contractData[1]?.result?.toString(),
      yieldEarnedRaw: contractData[2]?.result?.toString(),
      principalDepositedRaw: contractData[3]?.result?.toString(),
      processed: processedData
    })
    window.vaultDebugLogged = true
  }

  // Convert shares to USDC balance
  const { data: assetBalance } = useContractRead({
    address: VAULT_ADDRESS,
    abi: vaultABI,
    functionName: 'convertToAssets',
    args: [contractData?.[1]?.result || BigInt(0)],
    enabled: !!userAddress && !!contractData?.[1]?.result,
    watch: true,
  })

  const balance = assetBalance ? 
    parseFloat(ethers.formatUnits(assetBalance, 6)) : 
    processedData.shareBalance

  return {
    balance,
    totalAssets: processedData.totalAssets,
    yieldEarned: processedData.yieldEarned,
    principalDeposited: processedData.principalDeposited,
    shareBalance: processedData.shareBalance,
    isLoading: contractLoading,
  }
}

// Additional hook for historical yield data
export function useHistoricalYield(userAddress?: string) {
  return useQuery({
    queryKey: ['historicalYield', userAddress],
    queryFn: async () => {
      // This would fetch historical yield events from the blockchain
      // For now, return mock data
      const daysBack = 30
      const data = []
      
      for (let i = daysBack; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        // Mock yield accumulation
        const baseYield = 100
        const dailyGrowth = Math.random() * 2 - 1 // -1% to +1% daily variation
        const cumulativeYield = baseYield + (daysBack - i) * 0.1 + dailyGrowth
        
        data.push({
          date: date.toISOString().split('T')[0],
          yield: Math.max(0, cumulativeYield),
          apy: 3.5 + Math.random() * 2, // Mock APY between 3.5-5.5%
        })
      }
      
      return data
    },
    enabled: !!userAddress,
    staleTime: 300_000, // 5 minutes
  })
}