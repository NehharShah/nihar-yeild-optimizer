import * as dotenv from 'dotenv';
import { SimpleKeeperService } from './services/SimpleKeeperService';
import { logger } from './utils/logger';

dotenv.config();

async function testKeeper() {
  try {
    logger.info('🚀 Starting USDC Yield Optimizer Keeper Test...');

    const keeper = new SimpleKeeperService({
      rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
      privateKey: process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
      vaultAddress: process.env.VAULT_ADDRESS || '0xAD2eE75074b0e68B7D658de907C1BdbD72fE56BE',
      minRebalanceThreshold: 30,
      maxGasCostThreshold: 10,
    });

    // Initialize the keeper
    await keeper.initialize();

    // Run various health checks
    await keeper.checkNetworkHealth();
    await keeper.checkVaultStatus();
    await keeper.simulateRebalanceCheck();

    logger.info('✅ Keeper test completed successfully!');

  } catch (error) {
    logger.error('❌ Keeper test failed:', error);
    process.exit(1);
  }
}

testKeeper();