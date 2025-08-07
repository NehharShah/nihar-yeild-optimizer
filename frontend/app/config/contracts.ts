export interface ContractAddresses {
  vaultAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  adapters?: {
    aave: `0x${string}`;
    moonwell: `0x${string}`;
    morpho: `0x${string}`;
  };
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
  contracts: ContractAddresses;
}

export const NETWORK_CONFIGS: { [key: number]: NetworkConfig } = {
  8453: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    isTestnet: false,
    contracts: {
      vaultAddress: '0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f', // TBD - will be updated when deployed to mainnet
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    isTestnet: true,
    contracts: {
      vaultAddress: '0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f',
      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      adapters: {
        aave: '0x25e390f75320c7E88337e3945dcD68E6F0ca02ed',
        moonwell: '0x9258CB7AC8DcC2456C340837EEbA0926A06DE2D7',
        morpho: '0xB438f6DA411D17472AF1735511f9296E5C9341AF',
      },
    },
  },
};

// Default to Base Sepolia for now
export const DEFAULT_CHAIN_ID = 84532;

export function getNetworkConfig(chainId?: number): NetworkConfig {
  const config = NETWORK_CONFIGS[chainId || DEFAULT_CHAIN_ID];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

export function getContractAddresses(chainId?: number): ContractAddresses {
  return getNetworkConfig(chainId).contracts;
}

// Environment variable overrides
export const VAULT_ADDRESS = 
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`) ||
  getContractAddresses().vaultAddress;

export const USDC_ADDRESS = 
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`) ||
  getContractAddresses().usdcAddress;
