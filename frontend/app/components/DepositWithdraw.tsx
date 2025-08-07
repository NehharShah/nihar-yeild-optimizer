'use client'

import { useState } from 'react'
import { useAccount, useContractWrite, useContractRead, useNetwork } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'
import { ArrowDownCircle, ArrowUpCircle, Loader2, AlertCircle } from 'lucide-react'
import { getContractAddresses } from '../config/contracts'

const vaultABI = [
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' }
    ],
    name: 'deposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' }
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'previewDeposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'previewWithdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const usdcABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface DepositWithdrawProps {
  userBalance: number // User's vault balance in USDC
  vaultTotalAssets: number
}

export function DepositWithdraw({ userBalance, vaultTotalAssets }: DepositWithdrawProps) {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const contracts = getContractAddresses(chain?.id)
  const VAULT_ADDRESS = contracts.vaultAddress
  const USDC_ADDRESS = contracts.usdcAddress
  
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
  
  // Debug logging (only once)
  if (address && usdcBalance && !(window as any).debugLogged) {
    console.log('DepositWithdraw Debug:', {
      address,
      USDC_ADDRESS,
      VAULT_ADDRESS,
      usdcBalance: usdcBalance?.toString(),
      usdcBalanceFormatted,
      allowance: allowance?.toString(),
    });
    (window as any).debugLogged = true
  }

  const maxAmount = mode === 'deposit' ? usdcBalanceFormatted : userBalance
  const amountNum = parseFloat(amount) || 0

  const isValidAmount = amountNum > 0 && amountNum <= maxAmount

  const handleTransaction = async () => {
    if (!isValidAmount || !address) return

    setIsProcessing(true)
    try {
      const amountWei = parseUnits(amount, 6) // USDC has 6 decimals

      if (mode === 'deposit') {
        // Check if approval is needed - use a larger amount to avoid this issue
        const requiredAllowance = amountWei
        
        if (!allowance || allowance < requiredAllowance) {
          console.log('Approving USDC...', 'Required:', requiredAllowance.toString(), 'Current:', allowance?.toString())
          
          // Approve a larger amount to avoid frequent approvals
          const approveAmount = requiredAllowance * BigInt(10) // Approve 10x the amount
          
          const approveTx = await approveUSDC({
            args: [VAULT_ADDRESS, approveAmount],
          })
          
          console.log('Approval transaction sent:', approveTx)
          console.log('Waiting for approval to be processed...')
          
          // Wait a bit for the transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 3000))
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
    } catch (error: any) {
      console.error('Transaction failed:', error)
      
      // Extract more detailed error information
      let errorMessage = 'Unknown error'
      if (error?.reason) {
        errorMessage = error.reason
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      console.log('Detailed error:', {
        reason: error?.reason,
        message: error?.message,
        code: error?.code,
        data: error?.data,
        fullError: error
      })
      
      alert(`Transaction failed: ${errorMessage}`)
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