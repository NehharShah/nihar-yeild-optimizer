import axios from 'axios';
import { logger } from '../utils/logger';

export class APYService {
  private readonly DEFI_API_BASE = 'https://api.de.fi/v1';
  private readonly DEFILLAMA_API_BASE = 'https://yields.llama.fi';

  async getAPY(protocol: 'AAVE' | 'MORPHO' | 'MOONWELL'): Promise<number> {
    try {
      switch (protocol) {
        case 'AAVE':
          return await this.getAaveAPY();
        case 'MORPHO':
          return await this.getMorphoAPY();
        case 'MOONWELL':
          return await this.getMoonwellAPY();
        default:
          throw new Error(`Unknown protocol: ${protocol}`);
      }
    } catch (error) {
      logger.error(`Failed to fetch APY for ${protocol}:`, error);
      return 0; // Return 0 APY if fetch fails
    }
  }

  private async getAaveAPY(): Promise<number> {
    try {
      // Try De.Fi API first
      const response = await axios.get(`${this.DEFI_API_BASE}/opportunity/protocol/aave-v3/base/usdc+usdc`);
      
      if (response.data?.apy) {
        const apy = parseFloat(response.data.apy) * 100; // Convert to basis points
        logger.info(`Aave APY from De.Fi: ${apy} bps`);
        return Math.round(apy);
      }
    } catch (error) {
      logger.warn('Failed to fetch Aave APY from De.Fi:', error);
    }

    try {
      // Fallback to DeFiLlama
      const response = await axios.get(`${this.DEFILLAMA_API_BASE}/pools`);
      const aavePools = response.data.data?.filter((pool: any) => 
        pool.project === 'aave-v3' && 
        pool.chain === 'Base' && 
        pool.symbol?.toLowerCase().includes('usdc')
      );

      if (aavePools && aavePools.length > 0) {
        const apy = parseFloat(aavePools[0].apy) * 100;
        logger.info(`Aave APY from DeFiLlama: ${apy} bps`);
        return Math.round(apy);
      }
    } catch (error) {
      logger.warn('Failed to fetch Aave APY from DeFiLlama:', error);
    }

    // Default fallback APY for Aave (3.5%)
    logger.warn('Using default Aave APY');
    return 350; // 3.5% in basis points
  }

  private async getMorphoAPY(): Promise<number> {
    try {
      // Try Morpho's subgraph or API
      // Note: Morpho may have their own API endpoints
      const response = await axios.get(`${this.DEFILLAMA_API_BASE}/pools`);
      const morphoPools = response.data.data?.filter((pool: any) => 
        pool.project === 'morpho-blue' && 
        pool.chain === 'Base' && 
        pool.symbol?.toLowerCase().includes('usdc')
      );

      if (morphoPools && morphoPools.length > 0) {
        const apy = parseFloat(morphoPools[0].apy) * 100;
        logger.info(`Morpho APY: ${apy} bps`);
        return Math.round(apy);
      }
    } catch (error) {
      logger.warn('Failed to fetch Morpho APY:', error);
    }

    // Default fallback APY for Morpho (4.2%)
    logger.warn('Using default Morpho APY');
    return 420; // 4.2% in basis points
  }

  private async getMoonwellAPY(): Promise<number> {
    try {
      // Try Moonwell API or DeFiLlama
      const response = await axios.get(`${this.DEFILLAMA_API_BASE}/pools`);
      const moonwellPools = response.data.data?.filter((pool: any) => 
        pool.project === 'moonwell' && 
        pool.chain === 'Base' && 
        pool.symbol?.toLowerCase().includes('usdc')
      );

      if (moonwellPools && moonwellPools.length > 0) {
        const apy = parseFloat(moonwellPools[0].apy) * 100;
        logger.info(`Moonwell APY: ${apy} bps`);
        return Math.round(apy);
      }
    } catch (error) {
      logger.warn('Failed to fetch Moonwell APY:', error);
    }

    // Try direct Moonwell API
    try {
      const response = await axios.get('https://moonwell.fi/api/markets/supply/base/usdc');
      if (response.data?.apy) {
        const apy = parseFloat(response.data.apy) * 100;
        logger.info(`Moonwell APY from direct API: ${apy} bps`);
        return Math.round(apy);
      }
    } catch (error) {
      logger.warn('Failed to fetch Moonwell APY from direct API:', error);
    }

    // Default fallback APY for Moonwell (3.8%)
    logger.warn('Using default Moonwell APY');
    return 380; // 3.8% in basis points
  }

  async getAllAPYs(): Promise<{aave: number, morpho: number, moonwell: number}> {
    const [aave, morpho, moonwell] = await Promise.all([
      this.getAPY('AAVE'),
      this.getAPY('MORPHO'),
      this.getAPY('MOONWELL')
    ]);

    return { aave, morpho, moonwell };
  }

  async getHistoricalAPY(protocol: 'AAVE' | 'MORPHO' | 'MOONWELL', days: number = 7): Promise<number[]> {
    // This would fetch historical APY data for trend analysis
    // Implementation would depend on available data sources
    logger.info(`Fetching ${days} days of historical APY for ${protocol}`);
    
    // Placeholder implementation
    return Array(days).fill(0).map(() => Math.random() * 100 + 300); // Random APYs between 3-4%
  }
}