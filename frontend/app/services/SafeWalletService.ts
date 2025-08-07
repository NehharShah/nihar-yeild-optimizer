import { createPublicClient, http, Address, Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getSafe4337Config, NetworkConfig, SessionKeyPermission } from '../config/safe4337';

// Types
export interface SafeWalletData {
  address: Address;
  owners: Address[];
  threshold: number;
  isDeployed: boolean;
  sessionKeys: SessionKeyInfo[];
}

export interface SessionKeyInfo {
  keyId: string;
  address: Address;
  permissions: SessionKeyPermission;
  isActive: boolean;
  transactionCount: number;
  expiresAt: number;
}

export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

export class SafeWalletService {
  private config: NetworkConfig;
  private publicClient: any;
  private chainId: number;

  constructor(chainId?: number) {
    this.chainId = chainId || 8453;
    this.config = getSafe4337Config(this.chainId);
    this.initializeClients();
  }

  private initializeClients() {
    const chain = this.chainId === 84532 ? baseSepolia : base;
    const rpcUrl = this.chainId === 84532 ? 'https://sepolia.base.org' : 'https://mainnet.base.org';

    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
      chain,
    });
  }

  /**
   * Predict the Safe wallet address for a given owner
   */
  async predictSafeAddress(ownerAddress: Address, saltNonce: bigint): Promise<Address> {
    try {
      // For demo purposes, generate a predictable address based on owner and salt
      const predictedAddress = `0x${ownerAddress.slice(2, 10)}${'0'.repeat(32)}${saltNonce.toString(16).padStart(8, '0')}` as Address;
      return predictedAddress;
    } catch (error) {
      console.error('Error predicting Safe address:', error);
      throw new Error('Failed to predict Safe address');
    }
  }

  /**
   * Create a Safe wallet with session key for yield optimizer
   */
  async createSafeWithSessionKey(
    ownerPrivateKey: `0x${string}`,
    sessionKeyAddress: Address,
    vaultAddress: Address,
    saltNonce?: bigint
  ): Promise<{ safeAddress: Address; sessionKeyId: string; userOpHash: Hash }> {
    try {
      // For demo purposes, simulate Safe creation
      console.log('Creating Safe wallet with session key...');
      console.log('Owner private key provided:', !!ownerPrivateKey);
      console.log('Session key address:', sessionKeyAddress);
      console.log('Vault address:', vaultAddress);
      
      // Generate a demo Safe address
      const safeAddress = await this.predictSafeAddress(sessionKeyAddress, BigInt(123));
      const sessionKeyId = `demo-session-${Date.now()}`;
      const userOpHash = `0x${'0'.repeat(64)}` as Hash;

      return {
        safeAddress,
        sessionKeyId,
        userOpHash
      };
    } catch (error) {
      console.error('Error creating Safe with session key:', error);
      throw new Error('Failed to create Safe with session key');
    }
  }

  /**
   * Create a rebalance UserOperation using session key
   */
  async createRebalanceUserOp(
    safeAddress: Address,
    sessionKeyPrivateKey: `0x${string}`,
    targetProtocol: number,
    expectedGain: bigint,
    gasCost: bigint
  ): Promise<UserOperation> {
    // For demo purposes, return a mock UserOperation
    return {
      sender: safeAddress,
      nonce: BigInt(0),
      initCode: '0x',
      callData: '0x7dc0d1d0', // rebalance function selector
      callGasLimit: BigInt(100000),
      verificationGasLimit: BigInt(100000),
      preVerificationGas: BigInt(21000),
      maxFeePerGas: BigInt(1000000000),
      maxPriorityFeePerGas: BigInt(1000000000),
      paymasterAndData: '0x',
      signature: '0x'
    };
  }

  /**
   * Send UserOperation to bundler
   */
  async sendUserOperation(userOp: UserOperation): Promise<{ hash: Hash; wait: () => Promise<any> }> {
    try {
      // For demo purposes, simulate sending UserOperation
      const hash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}` as Hash;
      
      return {
        hash,
        wait: async () => {
          return { success: true, transactionHash: hash };
        }
      };
    } catch (error) {
      console.error('Error sending UserOperation:', error);
      throw new Error('Failed to send UserOperation');
    }
  }

  /**
   * Get Safe wallet information
   */
  async getSafeWalletInfo(safeAddress: Address): Promise<SafeWalletData> {
    try {
      // For demo purposes, simulate Safe wallet info
      const mockSessionKey: SessionKeyInfo = {
        keyId: 'demo-session-123',
        address: '0x1234567890123456789012345678901234567890' as Address,
        permissions: {
          target: '0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f' as Address,
          functionSelector: '0x7dc0d1d0' as `0x${string}`,
          valueLimit: BigInt(0),
          maxTransactions: 1000,
          validAfter: Math.floor(Date.now() / 1000),
          validUntil: Math.floor(Date.now() / 1000) + 86400
        },
        isActive: true,
        transactionCount: 5,
        expiresAt: Math.floor(Date.now() / 1000) + 86400
      };

      return {
        address: safeAddress,
        owners: ['0x7e296A887F7Bd9827D911f01D61ACe27DE542F87' as Address],
        threshold: 1,
        isDeployed: false, // Demo shows Safe not deployed yet
        sessionKeys: [mockSessionKey]
      };
    } catch (error) {
      console.error('Error getting Safe wallet info:', error);
      throw new Error('Failed to get Safe wallet information');
    }
  }

  /**
   * Create a session key for an existing Safe wallet
   */
  async createSessionKey(
    safeAddress: Address,
    sessionKeyAddress: Address,
    vaultAddress: Address,
    ownerPrivateKey: `0x${string}`,
    validUntil?: number,
    maxExecutions?: number
  ): Promise<{ sessionKeyId: string; txHash: Hash }> {
    try {
      console.log('Creating session key for Safe:', safeAddress);
      console.log('Session key address:', sessionKeyAddress);
      console.log('Vault address:', vaultAddress);
      
      // For demo purposes, simulate session key creation
      const sessionKeyId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}` as Hash;
      
      return {
        sessionKeyId,
        txHash
      };
    } catch (error) {
      console.error('Error creating session key:', error);
      throw new Error('Failed to create session key');
    }
  }

  /**
   * Revoke a session key
   */
  async revokeSessionKey(sessionKeyId: string, ownerPrivateKey: `0x${string}`): Promise<Hash> {
    try {
      // For demo purposes, simulate revoking session key
      console.log('Revoking session key:', sessionKeyId);
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}` as Hash;
      return txHash;
    } catch (error) {
      console.error('Error revoking session key:', error);
      throw new Error('Failed to revoke session key');
    }
  }
}
