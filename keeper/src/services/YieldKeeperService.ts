import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { APYService } from './APYService';
import { SafeService } from './SafeService';

export interface KeeperConfig {
  rpcUrl: string;
  privateKey: string;
  vaultAddress: string;
  safeAddress: string;
  minRebalanceThreshold: number; // basis points
  maxGasCostThreshold: number;   // basis points
}

export interface ProtocolAPY {
  protocol: 'AAVE' | 'MORPHO' | 'MOONWELL';
  apy: number; // basis points
  protocolId: number; // 0, 1, 2
}

export class YieldKeeperService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private apyService: APYService;
  private safeService: SafeService;
  
  // Vault contract ABI (minimal for our needs)
  private vaultAbi = [
    'function getCurrentAPY() view returns (uint256)',
    'function getProtocolAPY(uint8 protocol) view returns (uint256)',
    'function activeProtocol() view returns (uint8)',
    'function rebalance(uint8 targetProtocol, uint256 expectedGain, uint256 gasCost) external',
    'function totalAssets() view returns (uint256)'
  ];

  private vaultContract: ethers.Contract;

  constructor(private config: KeeperConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    this.vaultContract = new ethers.Contract(
      config.vaultAddress,
      this.vaultAbi,
      this.wallet
    );

    this.apyService = new APYService();
    this.safeService = new SafeService(config.safeAddress, this.wallet);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing YieldKeeperService...');
    
    // Validate configuration
    if (!this.config.vaultAddress || !this.config.safeAddress) {
      throw new Error('Vault address and Safe address are required');
    }

    // Initialize Safe service
    await this.safeService.initialize();
    
    logger.info('YieldKeeperService initialized successfully');
  }

  async checkAndRebalance(): Promise<void> {
    try {
      // Get current active protocol
      const activeProtocol = await this.vaultContract.activeProtocol();
      const activeProtocolName = this.getProtocolName(activeProtocol);
      
      logger.info(`Current active protocol: ${activeProtocolName} (${activeProtocol})`);

      // Get APYs from all protocols
      const apys = await this.getAllAPYs();
      logger.info('Current APYs:', apys);

      // Find the best protocol
      const bestProtocol = this.findBestProtocol(apys);
      logger.info(`Best protocol: ${bestProtocol.protocol} with ${bestProtocol.apy} bps APY`);

      // Check if rebalance is needed
      const currentAPY = apys.find(p => p.protocolId === activeProtocol)?.apy || 0;
      const expectedGain = bestProtocol.apy - currentAPY;

      if (bestProtocol.protocolId === activeProtocol) {
        logger.info('Already using the best protocol, no rebalance needed');
        return;
      }

      if (expectedGain < this.config.minRebalanceThreshold) {
        logger.info(`Expected gain ${expectedGain} bps is below threshold ${this.config.minRebalanceThreshold} bps`);
        return;
      }

      // Estimate gas cost
      const gasCost = await this.estimateRebalanceGasCost(bestProtocol.protocolId, expectedGain);
      
      if (gasCost > this.config.maxGasCostThreshold) {
        logger.warn(`Gas cost ${gasCost} bps exceeds threshold ${this.config.maxGasCostThreshold} bps`);
        return;
      }

      // Execute rebalance
      logger.info(`Executing rebalance to ${bestProtocol.protocol}...`);
      await this.executeRebalance(bestProtocol.protocolId, expectedGain, gasCost);
      
      logger.info('Rebalance completed successfully');

    } catch (error) {
      logger.error('Error in checkAndRebalance:', error);
      throw error;
    }
  }

  private async getAllAPYs(): Promise<ProtocolAPY[]> {
    const apys: ProtocolAPY[] = [];

    // Get APYs from vault contract (on-chain data)
    for (let i = 0; i < 3; i++) {
      try {
        const apy = await this.vaultContract.getProtocolAPY(i);
        apys.push({
          protocol: this.getProtocolName(i),
          apy: Number(apy),
          protocolId: i
        });
      } catch (error) {
        logger.warn(`Failed to get APY for protocol ${i}:`, error);
        // Fallback to off-chain data
        const offChainAPY = await this.apyService.getAPY(this.getProtocolName(i));
        apys.push({
          protocol: this.getProtocolName(i),
          apy: offChainAPY,
          protocolId: i
        });
      }
    }

    return apys;
  }

  private findBestProtocol(apys: ProtocolAPY[]): ProtocolAPY {
    return apys.reduce((best, current) => 
      current.apy > best.apy ? current : best
    );
  }

  private async estimateRebalanceGasCost(targetProtocol: number, expectedGain: number): Promise<number> {
    try {
      // Estimate gas for rebalance transaction
      const gasLimit = await this.vaultContract.rebalance.estimateGas(
        targetProtocol,
        expectedGain,
        0 // placeholder gas cost
      );

      const gasPrice = await this.provider.getFeeData();
      const totalGasCost = gasLimit * (gasPrice.gasPrice || 0n);

      // Get vault total assets to calculate percentage
      const totalAssets = await this.vaultContract.totalAssets();
      
      // Convert gas cost to basis points relative to total assets
      // Assuming 1 year = 365 days, annualize the cost
      const gasCostBps = totalAssets > 0 
        ? Number(totalGasCost * 365n * 10000n / totalAssets / 100n) // Approximate annualized cost
        : 0;

      logger.info(`Estimated gas cost: ${gasCostBps} bps (${totalGasCost.toString()} wei)`);
      return gasCostBps;

    } catch (error) {
      logger.warn('Failed to estimate gas cost:', error);
      return this.config.maxGasCostThreshold; // Conservative estimate
    }
  }

  private async executeRebalance(targetProtocol: number, expectedGain: number, gasCost: number): Promise<void> {
    try {
      // Build the rebalance transaction
      const rebalanceData = this.vaultContract.interface.encodeFunctionData('rebalance', [
        targetProtocol,
        expectedGain,
        gasCost
      ]);

      // Execute via Safe
      const txHash = await this.safeService.executeTransaction({
        to: this.config.vaultAddress,
        data: rebalanceData,
        value: '0'
      });

      logger.info(`Rebalance transaction submitted: ${txHash}`);

      // Wait for confirmation
      const receipt = await this.provider.waitForTransaction(txHash);
      
      if (receipt?.status === 1) {
        logger.info('Rebalance transaction confirmed');
      } else {
        throw new Error('Rebalance transaction failed');
      }

    } catch (error) {
      logger.error('Failed to execute rebalance:', error);
      throw error;
    }
  }

  private getProtocolName(protocolId: number): 'AAVE' | 'MORPHO' | 'MOONWELL' {
    switch (protocolId) {
      case 0: return 'AAVE';
      case 1: return 'MORPHO';
      case 2: return 'MOONWELL';
      default: throw new Error(`Invalid protocol ID: ${protocolId}`);
    }
  }
}