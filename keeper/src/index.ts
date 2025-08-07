import * as dotenv from 'dotenv';
import cron from 'node-cron';
import { YieldKeeperService } from './services/YieldKeeperService';
import { getNetworkConfig } from './config/networks';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  try {
    logger.info('Starting USDC Yield Optimizer Keeper...');

    const network = process.env.NETWORK || 'baseSepolia';
    const networkConfig = getNetworkConfig(network);
    
    logger.info(`Using network: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
    logger.info(`Vault address: ${networkConfig.vaultAddress}`);

    const keeper = new YieldKeeperService({
      rpcUrl: process.env.RPC_URL || networkConfig.rpcUrl,
      privateKey: process.env.KEEPER_PRIVATE_KEY || '',
      vaultAddress: process.env.VAULT_ADDRESS || networkConfig.vaultAddress,
      safeAddress: process.env.SAFE_ADDRESS || '',
      minRebalanceThreshold: parseInt(process.env.MIN_REBALANCE_THRESHOLD || '30'), // basis points
      maxGasCostThreshold: parseInt(process.env.MAX_GAS_COST_THRESHOLD || '10'),   // basis points
    });

    // Initialize the keeper
    await keeper.initialize();

    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        logger.info('Running yield optimization check...');
        await keeper.checkAndRebalance();
        logger.info('Yield optimization check completed');
      } catch (error) {
        logger.error('Error during yield optimization check:', error);
      }
    });

    // Run immediately on start
    logger.info('Running initial yield optimization check...');
    await keeper.checkAndRebalance();

    logger.info('Keeper is running. Press Ctrl+C to exit.');

    // Keep the process alive
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start keeper:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});