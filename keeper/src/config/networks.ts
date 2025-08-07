export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  vaultAddress: string;
  usdcAddress: string;
  adapters: {
    aave: string;
    moonwell: string;
    morpho: string;
  };
}

export const NETWORKS: { [key: string]: NetworkConfig } = {
  base: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    vaultAddress: process.env.VAULT_ADDRESS_MAINNET || '',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    adapters: {
      aave: process.env.AAVE_ADAPTER_MAINNET || '',
      moonwell: process.env.MOONWELL_ADAPTER_MAINNET || '',
      morpho: process.env.MORPHO_ADAPTER_MAINNET || ''
    }
  },
  baseSepolia: {
    name: 'Base Sepolia Testnet',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    vaultAddress: '0x61b3B4A39A7607cce75eEda58d6cf01Eddcd344f',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    adapters: {
      aave: '0x25e390f75320c7E88337e3945dcD68E6F0ca02ed',
      moonwell: '0x9258CB7AC8DcC2456C340837EEbA0926A06DE2D7',
      morpho: '0xB438f6DA411D17472AF1735511f9296E5C9341AF'
    }
  }
};

export function getNetworkConfig(network: string = 'baseSepolia'): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Network configuration not found for: ${network}`);
  }
  return config;
}
