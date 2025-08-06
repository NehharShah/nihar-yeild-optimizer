import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { KeeperDaemon, KeeperDaemonConfig } from '../services/KeeperDaemon';
import { logger } from '../utils/logger';

dotenv.config();

const app = express();
const port = process.env.KEEPER_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global keeper daemon instance
let keeperDaemon: KeeperDaemon | null = null;

const keeperConfig: KeeperDaemonConfig = {
  rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
  privateKey: process.env.KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  vaultAddress: process.env.VAULT_ADDRESS || '0xAD2eE75074b0e68B7D658de907C1BdbD72fE56BE',
  minRebalanceThreshold: parseInt(process.env.MIN_REBALANCE_THRESHOLD || '30'),
  maxGasCostThreshold: parseInt(process.env.MAX_GAS_COST_THRESHOLD || '10'),
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '30'),
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    keeper: keeperDaemon?.getStatus() || { isRunning: false }
  });
});

// Get keeper status
app.get('/api/keeper/status', (req, res) => {
  try {
    const status = keeperDaemon?.getStatus() || {
      isRunning: false,
      totalRebalances: 0,
      errors: [],
      currentAPY: 0,
      bestAPY: 0,
      bestProtocol: 'NONE'
    };
    
    res.json({
      success: true,
      status,
      config: {
        minRebalanceThreshold: keeperConfig.minRebalanceThreshold,
        maxGasCostThreshold: keeperConfig.maxGasCostThreshold,
        checkIntervalMinutes: keeperConfig.checkIntervalMinutes,
        vaultAddress: keeperConfig.vaultAddress
      }
    });
  } catch (error) {
    logger.error('Error getting keeper status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start keeper daemon
app.post('/api/keeper/start', async (req, res) => {
  try {
    if (keeperDaemon && keeperDaemon.getStatus().isRunning) {
      return res.json({
        success: true,
        message: 'Keeper is already running',
        status: keeperDaemon.getStatus()
      });
    }

    if (!keeperConfig.privateKey) {
      return res.status(400).json({
        success: false,
        error: 'KEEPER_PRIVATE_KEY or PRIVATE_KEY environment variable is required'
      });
    }

    logger.info('Starting keeper daemon via API...');
    
    keeperDaemon = new KeeperDaemon(keeperConfig);
    await keeperDaemon.start();

    res.json({
      success: true,
      message: 'Keeper daemon started successfully',
      status: keeperDaemon.getStatus()
    });

  } catch (error) {
    logger.error('Error starting keeper daemon:', error);
    keeperDaemon = null;
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop keeper daemon
app.post('/api/keeper/stop', async (req, res) => {
  try {
    if (!keeperDaemon || !keeperDaemon.getStatus().isRunning) {
      return res.json({
        success: true,
        message: 'Keeper is not running',
        status: { isRunning: false }
      });
    }

    logger.info('Stopping keeper daemon via API...');
    
    await keeperDaemon.stop();

    res.json({
      success: true,
      message: 'Keeper daemon stopped successfully',
      status: keeperDaemon.getStatus()
    });

  } catch (error) {
    logger.error('Error stopping keeper daemon:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update keeper configuration
app.post('/api/keeper/config', async (req, res) => {
  try {
    const { minRebalanceThreshold, maxGasCostThreshold, checkIntervalMinutes } = req.body;
    
    // Validate inputs
    if (minRebalanceThreshold !== undefined && (minRebalanceThreshold < 1 || minRebalanceThreshold > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'minRebalanceThreshold must be between 1 and 1000 bps'
      });
    }

    if (maxGasCostThreshold !== undefined && (maxGasCostThreshold < 1 || maxGasCostThreshold > 100)) {
      return res.status(400).json({
        success: false,
        error: 'maxGasCostThreshold must be between 1 and 100 bps'
      });
    }

    if (checkIntervalMinutes !== undefined && (checkIntervalMinutes < 5 || checkIntervalMinutes > 1440)) {
      return res.status(400).json({
        success: false,
        error: 'checkIntervalMinutes must be between 5 and 1440 minutes'
      });
    }

    // Update config
    if (minRebalanceThreshold !== undefined) {
      keeperConfig.minRebalanceThreshold = minRebalanceThreshold;
    }
    if (maxGasCostThreshold !== undefined) {
      keeperConfig.maxGasCostThreshold = maxGasCostThreshold;
    }
    if (checkIntervalMinutes !== undefined) {
      keeperConfig.checkIntervalMinutes = checkIntervalMinutes;
    }

    // If keeper is running, restart with new config
    const wasRunning = keeperDaemon?.getStatus().isRunning || false;
    if (wasRunning) {
      await keeperDaemon?.stop();
      keeperDaemon = new KeeperDaemon(keeperConfig);
      await keeperDaemon.start();
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        minRebalanceThreshold: keeperConfig.minRebalanceThreshold,
        maxGasCostThreshold: keeperConfig.maxGasCostThreshold,
        checkIntervalMinutes: keeperConfig.checkIntervalMinutes,
      },
      restarted: wasRunning
    });

  } catch (error) {
    logger.error('Error updating keeper config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Force a manual rebalance check
app.post('/api/keeper/check', async (req, res) => {
  try {
    if (!keeperDaemon) {
      return res.status(400).json({
        success: false,
        error: 'Keeper daemon is not initialized'
      });
    }

    // This would trigger a manual check - we'd need to add this method to the daemon
    res.json({
      success: true,
      message: 'Manual check triggered (this would force an immediate rebalance check)',
      status: keeperDaemon.getStatus()
    });

  } catch (error) {
    logger.error('Error triggering manual check:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (keeperDaemon) {
    await keeperDaemon.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (keeperDaemon) {
    await keeperDaemon.stop();
  }
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 Keeper API server running on http://localhost:${port}`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`Keeper status: http://localhost:${port}/api/keeper/status`);
});

export default app;