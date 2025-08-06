'use client'

import { useState } from 'react'
import { useAccount, useContractWrite, useContractRead } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ArrowDownCircle, ArrowUpCircle, Loader2, AlertCircle } from 'lucide-react'

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}` // USDC on Base

const vaultABI = [
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
] as const

const usdcABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const

interface DepositWithdrawProps {
  userBalance: number // User's vault balance in USDC
  vaultTotalAssets: number
}

export function DepositWithdraw({ userBalance, vaultTotalAssets }: DepositWithdrawProps) {
  const { address } = useAccount()
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Get USDC balance
  const { data: usdcBalance } = useContractRead({
    address: USDC_ADDRESS,
    abi: usdcABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  })

  // Get USDC allowance
  const { data: allowance } = useContractRead({
    address: USDC_ADDRESS,
    abi: usdcABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    enabled: !!address,
    watch: true,
  })

  // Contract writes
  const { writeAsync: approveUSDC } = useContractWrite({
    address: USDC_ADDRESS,
    abi: usdcABI,
    functionName: 'approve',
  })

  const { writeAsync: deposit } = useContractWrite({
    address: VAULT_ADDRESS,
    abi: vaultABI,
    functionName: 'deposit',
  })

  const { writeAsync: withdraw } = useContractWrite({
    address: VAULT_ADDRESS,
    abi: vaultABI,
    functionName: 'withdraw',
  })

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const usdcBalanceFormatted = usdcBalance ? 
    parseFloat(formatUnits(usdcBalance, 6)) : 0

  const maxAmount = mode === 'deposit' ? usdcBalanceFormatted : userBalance
  const amountNum = parseFloat(amount) || 0

  const isValidAmount = amountNum > 0 && amountNum <= maxAmount

  const handleTransaction = async () => {
    if (!isValidAmount || !address) return

    setIsProcessing(true)
    try {
      const amountWei = parseUnits(amount, 6) // USDC has 6 decimals

      if (mode === 'deposit') {
        // Check if approval is needed
        if (!allowance || allowance < amountWei) {
          console.log('Approving USDC...')
          await approveUSDC({
            args: [VAULT_ADDRESS, amountWei],
          })
        }

        console.log('Depositing...')
        await deposit({
          args: [amountWei, address],
        })
      } else {
        console.log('Withdrawing...')
        await withdraw({
          args: [amountWei, address, address],
        })
      }

      setAmount('')
      alert(`${mode === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`)
    } catch (error) {
      console.error('Transaction failed:', error)
      alert(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setIsProcessing(false)
  }

  return (
    <div className="bg-white rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Manage Funds</h2>
        
        {/* Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('deposit')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              mode === 'deposit'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 inline mr-2" />
            Deposit
          </button>
          <button
            onClick={() => setMode('withdraw')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              mode === 'withdraw'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 inline mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">USDC Wallet Balance</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatUSD(usdcBalanceFormatted)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Vault Balance</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatUSD(userBalance)}
          </p>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={() => setAmount(maxAmount.toString())}
              className="mr-3 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
              disabled={isProcessing}
            >
              MAX
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Max: {formatUSD(maxAmount)}
          </p>
          {!isValidAmount && amountNum > 0 && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Insufficient balance
            </div>
          )}
        </div>
      </div>

      {/* Transaction Button */}
      <button
        onClick={handleTransaction}
        disabled={!isValidAmount || isProcessing}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
          isValidAmount && !isProcessing
            ? mode === 'deposit'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </div>
        ) : (
          `${mode === 'deposit' ? 'Deposit' : 'Withdraw'} ${amount || '0'} USDC`
        )}
      </button>

      {/* Information */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <span className="font-medium">Note:</span> {
            mode === 'deposit' 
              ? 'Deposits are automatically allocated to the highest APY protocol. Your funds start earning yield immediately.'
              : 'Withdrawals may take a few minutes to process as funds are retrieved from the lending protocol.'
          }
        </p>
      </div>
    </div>
  )
}