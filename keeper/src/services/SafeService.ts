import { ethers } from 'ethers';
import SafeApiKit from '@safe-global/api-kit';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { logger } from '../utils/logger';

export interface TransactionData {
  to: string;
  data: string;
  value: string;
}

export class SafeService {
  private safeApiKit?: SafeApiKit;
  private protocolKit?: Safe;
  private ethAdapter: EthersAdapter;

  constructor(
    private safeAddress: string,
    private signer: ethers.Wallet
  ) {
    this.ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: this.signer
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Safe service...');

      // Initialize Safe API Kit (for Base network)
      this.safeApiKit = new SafeApiKit({
        txServiceUrl: 'https://safe-transaction-base.safe.global', // Base mainnet
        ethAdapter: this.ethAdapter
      });

      // Initialize Protocol Kit
      this.protocolKit = await Safe.create({
        ethAdapter: this.ethAdapter,
        safeAddress: this.safeAddress
      });

      // Verify the Safe is initialized
      const safeInfo = await this.protocolKit.getAddress();
      logger.info(`Safe initialized: ${safeInfo}`);

      // Check if signer is an owner
      const owners = await this.protocolKit.getOwners();
      const signerAddress = await this.signer.getAddress();
      
      if (!owners.includes(signerAddress)) {
        logger.warn(`Signer ${signerAddress} is not an owner of the Safe`);
        logger.info(`Safe owners: ${owners.join(', ')}`);
      }

    } catch (error) {
      logger.error('Failed to initialize Safe service:', error);
      throw error;
    }
  }

  async executeTransaction(transactionData: TransactionData): Promise<string> {
    if (!this.protocolKit || !this.safeApiKit) {
      throw new Error('Safe service not initialized');
    }

    try {
      logger.info('Creating Safe transaction...');

      // Create transaction
      const safeTransactionData = {
        to: transactionData.to,
        data: transactionData.data,
        value: transactionData.value,
      };

      const safeTransaction = await this.protocolKit.createTransaction({ safeTransactionData });
      const safeTxHash = await this.protocolKit.getTransactionHash(safeTransaction);

      logger.info(`Safe transaction hash: ${safeTxHash}`);

      // Sign transaction
      const senderSignature = await this.protocolKit.signTransaction(safeTransaction);
      logger.info('Transaction signed');

      // Check if we need more signatures
      const threshold = await this.protocolKit.getThreshold();
      logger.info(`Safe threshold: ${threshold}`);

      if (threshold === 1) {
        // Can execute immediately
        logger.info('Executing transaction (threshold = 1)...');
        const executeTxResponse = await this.protocolKit.executeTransaction(safeTransaction);
        const txHash = executeTxResponse.hash;
        
        logger.info(`Transaction executed: ${txHash}`);
        return txHash;

      } else {
        // Need to propose transaction for other owners to sign
        logger.info('Proposing transaction for multi-sig approval...');
        
        await this.safeApiKit.proposeTransaction({
          safeAddress: this.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: await this.signer.getAddress(),
          senderSignature: senderSignature.data,
        });

        logger.info('Transaction proposed successfully');
        return safeTxHash; // Return Safe transaction hash for tracking
      }

    } catch (error) {
      logger.error('Failed to execute Safe transaction:', error);
      throw error;
    }
  }

  async executeTransactionWithSessionKey(transactionData: TransactionData): Promise<string> {
    // This method would implement ERC-4337 execution with session keys
    // For now, fall back to regular Safe execution
    logger.info('Executing with session key (fallback to regular Safe)...');
    return this.executeTransaction(transactionData);
  }

  async getSafeInfo(): Promise<any> {
    if (!this.protocolKit) {
      throw new Error('Safe service not initialized');
    }

    const [address, owners, threshold, nonce] = await Promise.all([
      this.protocolKit.getAddress(),
      this.protocolKit.getOwners(),
      this.protocolKit.getThreshold(),
      this.protocolKit.getNonce()
    ]);

    return {
      address,
      owners,
      threshold,
      nonce
    };
  }

  async getPendingTransactions(): Promise<any[]> {
    if (!this.safeApiKit) {
      throw new Error('Safe service not initialized');
    }

    try {
      const pendingTxs = await this.safeApiKit.getPendingTransactions(this.safeAddress);
      return pendingTxs.results || [];
    } catch (error) {
      logger.error('Failed to get pending transactions:', error);
      return [];
    }
  }

  async confirmTransaction(safeTxHash: string): Promise<string> {
    if (!this.safeApiKit || !this.protocolKit) {
      throw new Error('Safe service not initialized');
    }

    try {
      logger.info(`Confirming transaction: ${safeTxHash}`);

      const signature = await this.protocolKit.signTransactionHash(safeTxHash);
      
      await this.safeApiKit.confirmTransaction(safeTxHash, signature.data);
      
      logger.info('Transaction confirmed');
      return safeTxHash;

    } catch (error) {
      logger.error('Failed to confirm transaction:', error);
      throw error;
    }
  }
}