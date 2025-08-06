import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { APYService } from './APYService';

export interface SimpleKeeperConfig {
  rpcUrl: string;
  privateKey: string;
  vaultAddress: string;
  minRebalanceThreshold: number;
  maxGasCostThreshold: number;
}

export class SimpleKeeperService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private apyService: APYService;
  
  private vaultAbi = [
    'function getCurrentAPY() view returns (uint256)',
    'function getProtocolAPY(uint8 protocol) view returns (uint256)',  
    'function activeProtocol() view returns (uint8)',
    'function totalAssets() view returns (uint256)',
    'function asset() view returns (address)',
    'function balanceOf(address account) view returns (uint256)',
    'function totalSupply() view returns (uint256)'
  ];

  private vaultContract: ethers.Contract;

  constructor(private config: SimpleKeeperConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    this.vaultContract = new ethers.Contract(
      config.vaultAddress,
      this.vaultAbi,
      this.wallet
    );

    this.apyService = new APYService();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing SimpleKeeperService...');
    
    try {
      const network = await this.provider.getNetwork();
      const walletAddress = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(walletAddress);
      
      logger.info(`Connected to network: ${network.name} (${network.chainId})`);
      logger.info(`Keeper wallet: ${walletAddress}`);
      logger.info(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
      
      // Test vault connection
      const vaultAsset = await this.vaultContract.asset();
      const totalAssets = await this.vaultContract.totalAssets();
      
      logger.info(`Vault asset: ${vaultAsset}`);
      logger.info(`Vault total assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);
      
    } catch (error) {
      logger.error('Failed to initialize keeper service:', error);
      throw error;
    }
    
    logger.info('SimpleKeeperService initialized successfully');
  }

  async checkVaultStatus(): Promise<void> {
    try {
      logger.info('=== Vault Status Check ===');
      
      // Get basic vault info
      const totalAssets = await this.vaultContract.totalAssets();
      const activeProtocol = await this.vaultContract.activeProtocol();
      const currentAPY = await this.vaultContract.getCurrentAPY();
      
      logger.info(`Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);
      logger.info(`Active Protocol: ${this.getProtocolName(activeProtocol)}`);
      logger.info(`Current APY: ${currentAPY} basis points (${(Number(currentAPY) / 100).toFixed(2)}%)`);
      
      // Get APYs from all protocols (this will likely fail on testnet, but that's expected)
      for (let i = 0; i < 3; i++) {
        try {
          const protocolAPY = await this.vaultContract.getProtocolAPY(i);
          logger.info(`${this.getProtocolName(i)} APY: ${protocolAPY} bps (${(Number(protocolAPY) / 100).toFixed(2)}%)`);
        } catch (error) {
          logger.warn(`Failed to get ${this.getProtocolName(i)} APY:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      // Get off-chain APY data
      const apyData = await this.apyService.getAllAPYs();
      logger.info('Off-chain APY data:', apyData);
      
    } catch (error) {
      logger.error('Error checking vault status:', error);
    }
  }

  async simulateRebalanceCheck(): Promise<void> {
    try {
      logger.info('=== Simulating Rebalance Check ===');
      
      // Get mock APY data since protocols aren't deployed on testnet
      const mockAPYs = [
        { protocol: 'AAVE', apy: 350, protocolId: 0 },
        { protocol: 'MORPHO', apy: 420, protocolId: 1 },
        { protocol: 'MOONWELL', apy: 380, protocolId: 2 }
      ];
      
      const activeProtocol = await this.vaultContract.activeProtocol();
      const currentAPY = mockAPYs.find(p => p.protocolId === activeProtocol)?.apy || 0;
      const bestProtocol = mockAPYs.reduce((best, current) => 
        current.apy > best.apy ? current : best
      );
      
      logger.info(`Current protocol: ${this.getProtocolName(activeProtocol)} (${currentAPY} bps)`);
      logger.info(`Best protocol: ${bestProtocol.protocol} (${bestProtocol.apy} bps)`);
      
      const expectedGain = bestProtocol.apy - currentAPY;
      
      if (expectedGain >= this.config.minRebalanceThreshold) {
        logger.info(`✅ Rebalance would be profitable: +${expectedGain} bps`);
        logger.info('📝 In production, this would trigger a rebalance transaction');
      } else {
        logger.info(`❌ Rebalance not profitable: only +${expectedGain} bps (need ≥${this.config.minRebalanceThreshold} bps)`);
      }
      
    } catch (error) {
      logger.error('Error simulating rebalance check:', error);
    }
  }

  async checkNetworkHealth(): Promise<void> {
    try {
      logger.info('=== Network Health Check ===');
      
      const [block, gasPrice] = await Promise.all([
        this.provider.getBlock('latest'),
        this.provider.getFeeData()
      ]);
      
      logger.info(`Latest block: ${block?.number}`);
      logger.info(`Block timestamp: ${new Date(block?.timestamp! * 1000).toISOString()}`);
      logger.info(`Gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} gwei`);
      logger.info(`Max fee per gas: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0, 'gwei')} gwei`);
      
    } catch (error) {
      logger.error('Error checking network health:', error);
    }
  }

  private getProtocolName(protocolId: number): string {
    switch (protocolId) {
      case 0: return 'AAVE';
      case 1: return 'MORPHO';
      case 2: return 'MOONWELL';
      default: return `UNKNOWN(${protocolId})`;
    }
  }
}