'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Address, Hash } from 'viem';
import { SafeWalletService, SafeWalletData, SessionKeyInfo } from '../services/SafeWalletService';

interface UseSafeWalletState {
  safeWallet: SafeWalletData | null;
  isLoading: boolean;
  error: string | null;
  sessionKeys: SessionKeyInfo[];
}

interface UseSafeWalletActions {
  createSafeWallet: (sessionKeyAddress: Address, vaultAddress: Address) => Promise<void>;
  grantSessionKey: (sessionKeyAddress: Address, vaultAddress: Address) => Promise<string>;
  revokeSessionKey: (sessionKeyId: string) => Promise<void>;
  refreshWalletData: () => Promise<void>;
  sendRebalanceTransaction: (targetProtocol: number, expectedGain: bigint, gasCost: bigint) => Promise<Hash>;
}

export interface UseSafeWalletReturn extends UseSafeWalletState, UseSafeWalletActions {}

export function useSafeWallet(): UseSafeWalletReturn {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  
  const [state, setState] = useState<UseSafeWalletState>({
    safeWallet: null,
    isLoading: false,
    error: null,
    sessionKeys: []
  });

  const [safeService] = useState(() => new SafeWalletService(chainId));

  // Update service when chain changes
  useEffect(() => {
    if (chainId) {
      // Create new service instance for the new chain
      setState(prev => ({ ...prev, safeWallet: null, sessionKeys: [] }));
    }
  }, [chainId]);

  // Load Safe wallet data when user connects
  useEffect(() => {
    if (userAddress) {
      refreshWalletData();
    } else {
      setState(prev => ({ ...prev, safeWallet: null, sessionKeys: [] }));
    }
  }, [userAddress]);

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  /**
   * Create a new Safe wallet with session key
   */
  const createSafeWallet = useCallback(async (
    sessionKeyAddress: Address,
    vaultAddress: Address
  ): Promise<void> => {
    if (!userAddress) {
      throw new Error('User not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we'd need to get the private key from the user
      // This is a simplified version for demonstration
      // Demo mode: Use placeholder private key (in production, use wallet signing)
      const privateKey = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      
      const result = await safeService.createSafeWithSessionKey(
        privateKey,
        sessionKeyAddress,
        vaultAddress
      );

      console.log('Safe created:', result);

      // Update state with the created Safe information
      const newSafeWallet: SafeWalletData = {
        address: result.safeAddress,
        owners: [userAddress],
        threshold: 1,
        isDeployed: true, // Mark as deployed since we just created it
        sessionKeys: [{
          keyId: result.sessionKeyId,
          address: sessionKeyAddress,
          permissions: {
            target: vaultAddress,
            functionSelector: '0x7dc0d1d0' as `0x${string}`,
            valueLimit: BigInt(0),
            maxTransactions: 1000,
            validAfter: Math.floor(Date.now() / 1000),
            validUntil: Math.floor(Date.now() / 1000) + 86400
          },
          isActive: true,
          transactionCount: 0,
          expiresAt: Math.floor(Date.now() / 1000) + 86400
        }]
      };

      setState(prev => ({
        ...prev,
        safeWallet: newSafeWallet,
        sessionKeys: newSafeWallet.sessionKeys
      }));

      console.log('Safe state updated:', newSafeWallet);
    } catch (error: any) {
      console.error('Error creating Safe wallet:', error);
      setError(error.message || 'Failed to create Safe wallet');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userAddress, safeService]);

  /**
   * Grant a session key to an address
   */
  const grantSessionKey = useCallback(async (
    sessionKeyAddress: Address,
    vaultAddress: Address
  ): Promise<string> => {
    if (!userAddress || !state.safeWallet?.address) {
      throw new Error('Safe wallet not available');
    }

    setLoading(true);
    setError(null);

    try {
      // Demo mode: Use placeholder private key (in production, use wallet signing)  
      const privateKey = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      
      // Create session key through the wallet service
      const result = await safeService.createSessionKey(
        state.safeWallet.address,
        sessionKeyAddress,
        vaultAddress,
        privateKey
      );

      // Create new session key object
      const newSessionKey: SessionKeyInfo = {
        keyId: result.sessionKeyId,
        address: sessionKeyAddress,
        permissions: {
          target: vaultAddress,
          functionSelector: '0x7dc0d1d0' as `0x${string}`,
          valueLimit: BigInt(0),
          maxTransactions: 1000,
          validAfter: Math.floor(Date.now() / 1000),
          validUntil: Math.floor(Date.now() / 1000) + 86400
        },
        isActive: true,
        transactionCount: 0,
        expiresAt: Math.floor(Date.now() / 1000) + 86400
      };

      // Update state with new session key
      setState(prev => ({
        ...prev,
        safeWallet: prev.safeWallet ? {
          ...prev.safeWallet,
          sessionKeys: [...prev.safeWallet.sessionKeys, newSessionKey]
        } : prev.safeWallet,
        sessionKeys: prev.sessionKeys ? [...prev.sessionKeys, newSessionKey] : [newSessionKey]
      }));

      console.log('Session key granted:', newSessionKey);
      return result.sessionKeyId;
    } catch (error: any) {
      console.error('Error granting session key:', error);
      setError(error.message || 'Failed to grant session key');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userAddress, state.safeWallet?.address, safeService]);

  /**
   * Revoke a session key
   */
  const revokeSessionKey = useCallback(async (sessionKeyId: string): Promise<void> => {
    if (!userAddress) {
      throw new Error('User not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Demo mode: Use placeholder private key (in production, use wallet signing)
      const privateKey = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
      await safeService.revokeSessionKey(sessionKeyId, privateKey);
      
      // Remove session key from state
      setState(prev => ({
        ...prev,
        safeWallet: prev.safeWallet ? {
          ...prev.safeWallet,
          sessionKeys: prev.safeWallet.sessionKeys.filter(key => key.keyId !== sessionKeyId)
        } : prev.safeWallet,
        sessionKeys: prev.sessionKeys.filter(key => key.keyId !== sessionKeyId)
      }));

      console.log('Session key revoked:', sessionKeyId);
    } catch (error: any) {
      console.error('Error revoking session key:', error);
      setError(error.message || 'Failed to revoke session key');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userAddress, safeService]);

  /**
   * Refresh Safe wallet data
   */
  const refreshWalletData = useCallback(async (): Promise<void> => {
    if (!userAddress) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Predict Safe address for the user
      const saltNonce = BigInt(0); // Default salt nonce
      const predictedAddress = await safeService.predictSafeAddress(userAddress, saltNonce);
      
      // Get wallet information
      const walletData = await safeService.getSafeWalletInfo(predictedAddress);
      
      setState(prev => ({
        ...prev,
        safeWallet: walletData,
        sessionKeys: walletData.sessionKeys
      }));
    } catch (error: any) {
      console.error('Error refreshing wallet data:', error);
      setError(error.message || 'Failed to refresh wallet data');
    } finally {
      setLoading(false);
    }
  }, [userAddress, safeService]);

  /**
   * Send a rebalance transaction using session key
   */
  const sendRebalanceTransaction = useCallback(async (
    targetProtocol: number,
    expectedGain: bigint,
    gasCost: bigint
  ): Promise<Hash> => {
    if (!state.safeWallet?.address) {
      throw new Error('Safe wallet not available');
    }

    setLoading(true);
    setError(null);

    try {
      // Get session key private key (this would be stored securely)
      const sessionKeyPrivateKey = await getSessionKeyPrivateKey();
      
      // Create rebalance UserOperation
      const userOp = await safeService.createRebalanceUserOp(
        state.safeWallet.address,
        sessionKeyPrivateKey,
        targetProtocol,
        expectedGain,
        gasCost
      );

      // Send UserOperation
      const result = await safeService.sendUserOperation(userOp);
      
      return result.hash;
    } catch (error: any) {
      console.error('Error sending rebalance transaction:', error);
      setError(error.message || 'Failed to send rebalance transaction');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [state.safeWallet?.address, safeService]);

  return {
    // State
    ...state,
    
    // Actions
    createSafeWallet,
    grantSessionKey,
    revokeSessionKey,
    refreshWalletData,
    sendRebalanceTransaction
  };
}

// Helper functions for demo purposes
// Note: In production, these would use proper wallet signing instead of private key access
async function getUserPrivateKey(): Promise<`0x${string}`> {
  // Demo mode: Return placeholder private key
  // In production: Use wallet.signMessage() or similar wallet-based signing
  return '0x0000000000000000000000000000000000000000000000000000000000000000';
}

async function getSessionKeyPrivateKey(): Promise<`0x${string}`> {
  // Demo mode: Return placeholder private key
  // In production: Use secure key derivation from wallet signatures
  return '0x0000000000000000000000000000000000000000000000000000000000000001';
}

// Types for external use
export type { SafeWalletData, SessionKeyInfo };
