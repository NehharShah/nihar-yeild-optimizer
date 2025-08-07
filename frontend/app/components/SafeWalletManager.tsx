'use client';

import React, { useState } from 'react';
import { useSafeWallet } from '../hooks/useSafeWallet';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { getContractAddresses } from '../config/contracts';

interface SafeWalletManagerProps {
  onWalletCreated?: (safeAddress: Address) => void;
}

export default function SafeWalletManager({ onWalletCreated }: SafeWalletManagerProps) {
  const { address: userAddress, isConnected } = useAccount();
  const {
    safeWallet,
    isLoading,
    error,
    sessionKeys,
    createSafeWallet,
    grantSessionKey,
    revokeSessionKey,
    refreshWalletData
  } = useSafeWallet();

  const [sessionKeyAddress, setSessionKeyAddress] = useState<string>('');
  const [isCreatingSafe, setIsCreatingSafe] = useState(false);
  const [isGrantingKey, setIsGrantingKey] = useState(false);

  // Get vault address for current network
  const contractAddresses = getContractAddresses();
  const vaultAddress = contractAddresses.vaultAddress as Address;

  const handleCreateSafe = async () => {
    if (!sessionKeyAddress.trim()) {
      alert('Please enter a session key address');
      return;
    }

    try {
      setIsCreatingSafe(true);
      await createSafeWallet(sessionKeyAddress as Address, vaultAddress);
      
      if (safeWallet?.address && onWalletCreated) {
        onWalletCreated(safeWallet.address);
      }
      
      alert('Safe wallet created successfully!');
      setSessionKeyAddress('');
    } catch (error: any) {
      console.error('Failed to create Safe wallet:', error);
      alert(`Failed to create Safe wallet: ${error.message}`);
    } finally {
      setIsCreatingSafe(false);
    }
  };

  const handleGrantSessionKey = async () => {
    if (!sessionKeyAddress.trim()) {
      alert('Please enter a session key address');
      return;
    }

    try {
      setIsGrantingKey(true);
      const keyId = await grantSessionKey(sessionKeyAddress as Address, vaultAddress);
      alert(`Session key granted successfully! Key ID: ${keyId}`);
      setSessionKeyAddress('');
    } catch (error: any) {
      console.error('Failed to grant session key:', error);
      alert(`Failed to grant session key: ${error.message}`);
    } finally {
      setIsGrantingKey(false);
    }
  };

  const handleRevokeSessionKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this session key?')) {
      return;
    }

    try {
      await revokeSessionKey(keyId);
      alert('Session key revoked successfully!');
    } catch (error: any) {
      console.error('Failed to revoke session key:', error);
      alert(`Failed to revoke session key: ${error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Safe Smart Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to manage Safe accounts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Safe Smart Wallet</h2>
        <button
          onClick={refreshWalletData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Wallet Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Status</h3>
        {safeWallet ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Safe Address:</span>
              <span className="font-mono text-sm break-all">{safeWallet.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deployed:</span>
              <span className={safeWallet.isDeployed ? 'text-green-600' : 'text-yellow-600'}>
                {safeWallet.isDeployed ? 'Yes' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Owners:</span>
              <span>{safeWallet.owners.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Threshold:</span>
              <span>{safeWallet.threshold}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No Safe wallet found for your address</p>
        )}
      </div>

      {/* Create Safe Wallet */}
      {!safeWallet?.isDeployed && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Safe Wallet</h3>
          <p className="text-gray-600 mb-4">
            Create a new Safe smart wallet with session key permissions for automated rebalancing.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keeper Bot Session Key Address
              </label>
              <input
                type="text"
                value={sessionKeyAddress}
                onChange={(e) => setSessionKeyAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This address will have permission to execute rebalance operations only
              </p>
            </div>
            <button
              onClick={handleCreateSafe}
              disabled={isCreatingSafe || !sessionKeyAddress.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSafe ? 'Creating Safe...' : 'Create Safe Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Session Key Management */}
      {safeWallet?.isDeployed && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Key Management</h3>
          
          {/* Grant New Session Key */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Grant Session Key</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Key Address
                </label>
                <input
                  type="text"
                  value={sessionKeyAddress}
                  onChange={(e) => setSessionKeyAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleGrantSessionKey}
                disabled={isGrantingKey || !sessionKeyAddress.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGrantingKey ? 'Granting...' : 'Grant Session Key'}
              </button>
            </div>
          </div>

          {/* Active Session Keys */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-2">Active Session Keys</h4>
            {sessionKeys.length > 0 ? (
              <div className="space-y-3">
                {sessionKeys.map((sessionKey, index) => (
                  <div key={sessionKey.keyId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Address:</span>
                          <span className="font-mono text-xs break-all">{sessionKey.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Status:</span>
                          <span className={sessionKey.isActive ? 'text-green-600' : 'text-red-600'}>
                            {sessionKey.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Used:</span>
                          <span>{sessionKey.transactionCount} transactions</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">Expires:</span>
                          <span>{new Date(sessionKey.expiresAt * 1000).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSessionKey(sessionKey.keyId)}
                        className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No active session keys</p>
            )}
          </div>
        </div>
      )}

      {/* Auto-Yield Toggle */}
      {safeWallet?.isDeployed && sessionKeys.length > 0 && (
        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Yield Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800">
                ✅ Auto-yield is enabled with {sessionKeys.filter(k => k.isActive).length} active session key(s)
              </p>
              <p className="text-sm text-green-700">
                The keeper bot can automatically rebalance your funds to optimize yield
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🛡️ Safety Features</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Session keys can only execute rebalance operations</li>
          <li>• Session keys cannot withdraw or transfer funds</li>
          <li>• Daily transaction limits are enforced</li>
          <li>• Session keys expire automatically after 24 hours</li>
          <li>• You can revoke session keys at any time</li>
        </ul>
      </div>
    </div>
  );
}
