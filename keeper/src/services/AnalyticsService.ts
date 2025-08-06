import axios from 'axios';
import { logger } from '../utils/logger';

export interface RebalanceEvent {
  fromProtocol: string;
  toProtocol: string;
  amount: number;
  apyGain: number;
  gasCost: number;
  txHash: string;
  timestamp: string;
}

export interface YieldEvent {
  protocol: string;
  totalAssets: number;
  apySnapshot: number;
  yieldGenerated: number;
  timestamp: string;
}

export class AnalyticsService {
  private segmentWriteKey: string;
  private segmentApiUrl = 'https://api.segment.io/v1/track';

  constructor() {
    this.segmentWriteKey = process.env.SEGMENT_WRITE_KEY || '';
  }

  private async sendEvent(event: string, properties: Record<string, any>, userId?: string) {
    if (!this.segmentWriteKey) {
      logger.warn('Segment write key not configured, skipping analytics');
      return;
    }

    try {
      const payload = {
        userId: userId || 'keeper-service',
        event,
        properties: {
          ...properties,
          source: 'keeper-service',
          network: 'base',
          timestamp: new Date().toISOString(),
        }
      };

      const response = await axios.post(this.segmentApiUrl, payload, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      logger.info(`Analytics event sent: ${event}`, { status: response.status });
    } catch (error) {
      logger.error('Failed to send analytics event:', error);
    }
  }

  async trackRebalanceExecuted(event: RebalanceEvent) {
    await this.sendEvent('rebalance_executed', {
      from_protocol: event.fromProtocol,
      to_protocol: event.toProtocol,
      amount: event.amount,
      apy_gain_bps: event.apyGain,
      gas_cost_bps: event.gasCost,
      transaction_hash: event.txHash,
      automated: true,
    });
  }

  async trackYieldSnapshot(event: YieldEvent) {
    await this.sendEvent('yield_snapshot', {
      protocol: event.protocol,
      total_assets: event.totalAssets,
      apy_current: event.apySnapshot,
      yield_generated: event.yieldGenerated,
    });
  }

  async trackKeeperHealth(status: 'healthy' | 'warning' | 'error', details?: any) {
    await this.sendEvent('keeper_health_check', {
      status,
      details,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
    });
  }

  async trackAPYFetch(apyData: { protocol: string; apy: number; source: string }[]) {
    await this.sendEvent('apy_data_fetched', {
      protocols: apyData,
      fetch_timestamp: new Date().toISOString(),
    });
  }

  async trackGasOptimization(gasPriceGwei: number, decision: 'proceed' | 'delay', threshold: number) {
    await this.sendEvent('gas_optimization', {
      gas_price_gwei: gasPriceGwei,
      decision,
      threshold_gwei: threshold,
      delay_reason: decision === 'delay' ? 'gas_too_high' : null,
    });
  }

  async trackError(errorType: string, errorMessage: string, context?: any) {
    await this.sendEvent('keeper_error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
      stack_trace: context?.stack,
    });
  }

  // Batch tracking for efficiency
  async trackBatch(events: Array<{ event: string; properties: Record<string, any> }>) {
    if (!this.segmentWriteKey) return;

    try {
      const batchPayload = {
        batch: events.map(({ event, properties }) => ({
          userId: 'keeper-service',
          event,
          properties: {
            ...properties,
            source: 'keeper-service',
            network: 'base',
            timestamp: new Date().toISOString(),
          }
        }))
      };

      const response = await axios.post('https://api.segment.io/v1/batch', batchPayload, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info(`Batch analytics events sent: ${events.length} events`, { status: response.status });
    } catch (error) {
      logger.error('Failed to send batch analytics events:', error);
    }
  }

  // Daily summary tracking
  async trackDailySummary(summary: {
    totalRebalances: number;
    totalYieldGenerated: number;
    averageAPYGain: number;
    totalGasCost: number;
    protocolDistribution: Record<string, number>;
  }) {
    await this.sendEvent('daily_summary', {
      total_rebalances: summary.totalRebalances,
      total_yield_generated: summary.totalYieldGenerated,
      average_apy_gain_bps: summary.averageAPYGain,
      total_gas_cost_usd: summary.totalGasCost,
      protocol_distribution: summary.protocolDistribution,
      date: new Date().toISOString().split('T')[0],
    });
  }
}