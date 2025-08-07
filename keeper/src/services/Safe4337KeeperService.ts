import { createPublicClient, http, Address, Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../utils/logger.js';

interface Safe4337Config {
  entryPoint: Address;
  safe4337Module: Address;
  safeProxyFactory: Address;
  safeSingleton: Address;
  addModuleLib: Address;
  multiSend: Address;
  chainId: number;
  bundlerUrl: string;
  paymasterUrl: string;
}

interface UserOperation {
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

export class Safe4337KeeperService {
  private config: Safe4337Config;
  private publicClient: any;
  private sessionKeyAccount: any;
  private safeAddress: Address;
  private vaultAddress: Address;

  constructor(
    chainId: number,
    safeAddress: Address,
    vaultAddress: Address,
    sessionKeyPrivateKey: `0x${string}`,
    pimlicoApiKey: string
  ) {
    this.config = this.getConfig(chainId);
    this.safeAddress = safeAddress;
    this.vaultAddress = vaultAddress;
    this.sessionKeyAccount = privateKeyToAccount(sessionKeyPrivateKey);
    
    this.initializeClients(pimlicoApiKey);
    logger.info('Safe4337KeeperService initialized', {
      chainId,
      safeAddress,
      vaultAddress,
      sessionKeyAddress: this.sessionKeyAccount.address
    });
  }

  private getConfig(chainId: number): Safe4337Config {
    const configs = {
      8453: { // Base Mainnet
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
        safe4337Module: '0xa581c4A4DB7175302464fF3C06380BC3270b4037' as Address,
        safeProxyFactory: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67' as Address,
        safeSingleton: '0x41675C099F32341bf84BFc5382aF534df5C7461a' as Address,
        addModuleLib: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb' as Address,
        multiSend: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526' as Address,
        chainId: 8453,
        bundlerUrl: 'https://api.pimlico.io/v1/base/rpc',
        paymasterUrl: 'https://api.pimlico.io/v2/base/rpc'
      },
      84532: { // Base Sepolia
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
        safe4337Module: '0xa581c4A4DB7175302464fF3C06380BC3270b4037' as Address,
        safeProxyFactory: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67' as Address,
        safeSingleton: '0x41675C099F32341bf84BFc5382aF534df5C7461a' as Address,
        addModuleLib: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb' as Address,
        multiSend: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526' as Address,
        chainId: 84532,
        bundlerUrl: 'https://api.pimlico.io/v1/base-sepolia/rpc',
        paymasterUrl: 'https://api.pimlico.io/v2/base-sepolia/rpc'
      }
    };

    const config = configs[chainId as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    return config;
  }

  private initializeClients(pimlicoApiKey: string) {
    const chain = this.config.chainId === 84532 ? baseSepolia : base;
    const rpcUrl = this.config.chainId === 84532 ? 
      'https://sepolia.base.org' : 'https://mainnet.base.org';

    // Public client for reading blockchain state
    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
      chain,
    });

    logger.info('Clients initialized', {
      chainId: this.config.chainId,
      rpcUrl: rpcUrl.substring(0, 30) + '...'
    });
  }

  /**
   * Execute a rebalance transaction using session key
   */
  async executeRebalance(
    targetProtocol: number,
    expectedGain: number,
    gasCost: number
  ): Promise<{ success: boolean; txHash?: Hash; error?: string }> {
    try {
      logger.info('Executing rebalance transaction (demo mode)', {
        safeAddress: this.safeAddress,
        targetProtocol,
        expectedGain,
        gasCost
      });

      // For demo purposes, simulate a successful rebalance
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      const mockTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}` as Hash;

      logger.info('Rebalance transaction completed (simulated)', {
        txHash: mockTxHash,
        safeAddress: this.safeAddress,
        targetProtocol
      });

      return {
        success: true,
        txHash: mockTxHash
      };

    } catch (error: any) {
      logger.error('Failed to execute rebalance', {
        error: error.message,
        safeAddress: this.safeAddress,
        targetProtocol
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a UserOperation for rebalance transaction (demo mode)
   */
  private async createRebalanceUserOp(
    targetProtocol: number,
    expectedGain: bigint,
    gasCost: bigint
  ): Promise<UserOperation> {
    // Return a mock UserOperation for demonstration
    return {
      sender: this.safeAddress,
      nonce: BigInt(0),
      initCode: '0x',
      callData: this.encodeRebalanceCall(targetProtocol, expectedGain, gasCost),
      callGasLimit: BigInt(200000),
      verificationGasLimit: BigInt(300000),
      preVerificationGas: BigInt(21000),
      maxFeePerGas: BigInt(1000000000),
      maxPriorityFeePerGas: BigInt(1000000000),
      paymasterAndData: '0x',
      signature: '0x'
    };
  }

  /**
   * Encode rebalance function call data
   */
  private encodeRebalanceCall(
    targetProtocol: number,
    expectedGain: bigint,
    gasCost: bigint
  ): `0x${string}` {
    // This would encode the call to Safe4337Module's executeUserOp function
    // which then calls the vault's rebalance function
    
    // For now, returning a placeholder - this needs proper Safe transaction encoding
    const rebalanceFunctionSelector = '0x7dc0d1d0'; // rebalance(uint8,uint256,uint256)
    
    // Encode the rebalance call
    const rebalanceData = `${rebalanceFunctionSelector}${
      targetProtocol.toString(16).padStart(64, '0')
    }${
      expectedGain.toString(16).padStart(64, '0')
    }${
      gasCost.toString(16).padStart(64, '0')
    }`;

    // This would need to be wrapped in Safe's execTransaction call
    // For demonstration purposes, returning the direct call data
    return rebalanceData as `0x${string}`;
  }

  /**
   * Calculate UserOperation hash for signing
   */
  private async getUserOpHash(userOp: UserOperation): Promise<`0x${string}`> {
    // Demo implementation - would normally use proper EIP-4337 hash calculation
    const hash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    return hash as `0x${string}`;
  }

  /**
   * Check if the session key is still valid
   */
  async isSessionKeyValid(): Promise<boolean> {
    try {
      logger.info('Checking session key validity', {
        sessionKeyAddress: this.sessionKeyAccount.address,
        safeAddress: this.safeAddress
      });
      
      // For demo purposes, assume session key is valid
      return true;
    } catch (error) {
      logger.error('Failed to check session key validity', error);
      return false;
    }
  }

  /**
   * Get Safe wallet information
   */
  async getSafeInfo(): Promise<{
    address: Address;
    owners: Address[];
    threshold: number;
    isDeployed: boolean;
  }> {
    try {
      // Check if Safe is deployed
      const code = await this.publicClient.getBytecode({
        address: this.safeAddress
      });
      const isDeployed = code !== undefined && code !== '0x';

      if (!isDeployed) {
        return {
          address: this.safeAddress,
          owners: [],
          threshold: 0,
          isDeployed: false
        };
      }

      // Get owners and threshold
      const owners = await this.publicClient.readContract({
        address: this.safeAddress,
        abi: [
          {
            name: 'getOwners',
            type: 'function',
            inputs: [],
            outputs: [{ name: '', type: 'address[]' }]
          }
        ],
        functionName: 'getOwners'
      }) as Address[];

      const threshold = await this.publicClient.readContract({
        address: this.safeAddress,
        abi: [
          {
            name: 'getThreshold',
            type: 'function',
            inputs: [],
            outputs: [{ name: '', type: 'uint256' }]
          }
        ],
        functionName: 'getThreshold'
      }) as number;

      return {
        address: this.safeAddress,
        owners,
        threshold,
        isDeployed: true
      };

    } catch (error) {
      logger.error('Failed to get Safe info', error);
      throw error;
    }
  }
}
