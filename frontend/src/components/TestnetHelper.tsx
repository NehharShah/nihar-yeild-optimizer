'use client';

import { useState } from 'react';
import { useAccount, useBalance, useContractWrite, useWaitForTransaction, useNetwork } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
// Contract addresses
const CONTRACTS = {
  VAULT_ADDRESS: '0x9094E827F56c1a19666B9D33790bFf0678868685',
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

export default function TestnetHelper() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [mintAmount, _setMintAmount] = useState('100');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  
  const { write: _writeContract, isLoading: _isPending } = useContractWrite({
    onSuccess(data) {
      setTxHash(data.hash);
    },
  });
  const { isLoading: _isConfirming, isSuccess: _isSuccess } = useWaitForTransaction({
    hash: txHash,
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC_ADDRESS as `0x${string}`,
  });

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  const handleMintUSDC = async () => {
    if (!address || !mintAmount) return;

    const amount = parseUnits(mintAmount, 6);
    
    // This is a mock mint function - in reality you'd need a faucet or testnet USDC contract with mint function
    // For Base Sepolia, you might need to use a different approach
    console.log('Attempting to mint', mintAmount, 'USDC to', address);
    
    // You'll need to replace this with actual testnet USDC minting
    // For now, let's just log the information
    alert(`To get testnet USDC on Base Sepolia:
1. Go to a Base Sepolia faucet
2. Get some testnet ETH first
3. Use a testnet USDC faucet or swap service
4. The USDC contract address is: ${CONTRACTS.USDC_ADDRESS}`);
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testnet Helper</h3>
        <p className="text-yellow-700">Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🧪 Base Sepolia Testnet Helper</h3>
      
      {/* Network Check */}
      <div className="mb-4">
        <h4 className="font-medium text-blue-700 mb-2">Network Status</h4>
        <p className="text-sm">
          Current Network: <span className="font-mono">{chain?.name || 'Unknown'}</span>
        </p>
        <p className="text-sm">
          Chain ID: <span className="font-mono">{chain?.id || 'Unknown'}</span>
        </p>
        {chain?.id !== 84532 && (
          <p className="text-red-600 text-sm mt-1">
            ⚠️ You&apos;re not on Base Sepolia (Chain ID: 84532). Please switch networks.
          </p>
        )}
      </div>

      {/* Balance Check */}
      <div className="mb-4">
        <h4 className="font-medium text-blue-700 mb-2">Your Balances</h4>
        <div className="space-y-1 text-sm">
          <p>ETH: {ethBalance ? formatUnits(ethBalance.value, 18) : '0'} ETH</p>
          <p>USDC: {usdcBalance ? formatUnits(usdcBalance.value, 6) : '0'} USDC</p>
        </div>
        
        {!ethBalance || ethBalance.value === BigInt(0) && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
            ⚠️ You need testnet ETH first. Get some from a Base Sepolia faucet.
          </div>
        )}
      </div>

      {/* Contract Addresses */}
      <div className="mb-4">
        <h4 className="font-medium text-blue-700 mb-2">Contract Addresses</h4>
        <div className="space-y-1 text-xs font-mono bg-gray-100 p-2 rounded">
          <p>Vault: {CONTRACTS.VAULT_ADDRESS}</p>
          <p>USDC: {CONTRACTS.USDC_ADDRESS}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-blue-700 mb-2">Get Testnet USDC</h4>
          <p className="text-sm text-gray-600 mb-2">
                          You&apos;ll need testnet USDC to test deposits. Here are some options:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• Use a Base Sepolia faucet that provides USDC</li>
            <li>• Bridge from another testnet using a testnet bridge</li>
            <li>• Use a DEX on Base Sepolia to swap ETH for USDC</li>
          </ul>
          
          <button
            onClick={handleMintUSDC}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Get Testnet USDC Info
          </button>
        </div>

        {/* Debug Info */}
        <div>
          <h4 className="font-medium text-blue-700 mb-2">Debug Info</h4>
          <div className="text-xs bg-gray-100 p-2 rounded">
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p>Address: {address}</p>
            <p>USDC Contract: {CONTRACTS.USDC_ADDRESS}</p>
            <p>Vault Contract: {CONTRACTS.VAULT_ADDRESS}</p>
          </div>
        </div>
      </div>
    </div>
  );
}