// Safe4337 Configuration for Base Networks
export const SAFE_4337_CONFIG = {
  base: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    safe4337Module: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
    safeProxyFactory: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    safeSingleton: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
    addModuleLib: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
    multiSend: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    sessionKeyManager: '0x0000000000000000000000000000000000000000', // Deploy to mainnet later
    safeWalletFactory: '0x0000000000000000000000000000000000000000', // Deploy to mainnet later
    chainId: 8453,
    bundlerUrl: 'https://api.pimlico.io/v1/base/rpc',
    paymasterUrl: 'https://api.pimlico.io/v2/base/rpc'
  },
  baseSepolia: {
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    safe4337Module: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
    safeProxyFactory: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    safeSingleton: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
    addModuleLib: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
    multiSend: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    sessionKeyManager: '0xbB0b6DB7dF23488Ad16115507e2516e24b2Ab81C',
    safeWalletFactory: '0xAF7E4Ee5dEB0Aab72d46a7F94F273Cc9cb0BAB02',
    chainId: 84532,
    bundlerUrl: 'https://api.pimlico.io/v1/base-sepolia/rpc',
    paymasterUrl: 'https://api.pimlico.io/v2/base-sepolia/rpc'
  }
};

export type NetworkConfig = typeof SAFE_4337_CONFIG.base & {
  sessionKeyManager?: string;
  safeWalletFactory?: string;
};

export function getSafe4337Config(chainId?: number): NetworkConfig {
  if (chainId === 84532) {
    return SAFE_4337_CONFIG.baseSepolia;
  }
  return SAFE_4337_CONFIG.base;
}

// Session Key Permission Types
export interface SessionKeyPermission {
  target: `0x${string}`;       // Contract address
  functionSelector: `0x${string}`;  // Function selector (4 bytes)
  valueLimit: bigint;          // Maximum ETH value per transaction
  maxTransactions?: number;    // Maximum number of transactions
  validAfter: number;          // Unix timestamp when session key becomes valid
  validUntil: number;          // Unix timestamp when session key expires
}

// Rebalance-only permission for our yield optimizer
export const REBALANCE_ONLY_PERMISSION: SessionKeyPermission = {
  target: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Will be set to vault address
  functionSelector: '0x7dc0d1d0' as `0x${string}`, // rebalance(uint8,uint256,uint256) selector
  valueLimit: BigInt(0), // No ETH value allowed for rebalance calls
  maxTransactions: 1000, // Allow up to 1000 rebalances per day
  validAfter: 0, // Valid immediately
  validUntil: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Valid for 24 hours
};
