import * as dotenv from 'dotenv';
import cron from 'node-cron';
import { YieldKeeperService } from './services/YieldKeeperService';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  try {
    logger.info('Starting USDC Yield Optimizer Keeper...');

    const keeper = new YieldKeeperService({
      rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
      privateKey: process.env.KEEPER_PRIVATE_KEY || '',
      vaultAddress: process.env.VAULT_ADDRESS || '',
      safeAddress: process.env.SAFE_ADDRESS || '',
      minRebalanceThreshold: 30, // 30 basis points
      maxGasCostThreshold: 10,   // 10 basis points
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