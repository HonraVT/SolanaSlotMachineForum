// src/controllers/webhookController.js
import { getDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { logger } from '../utils/logger.js';
import config from '../config/environment.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

class WebhookController {
  constructor() {
    this.userModel = new User();
    this.transactionModel = new Transaction();
  }

  async handleSolanaWebhook(req, res) {
    try {
      const transactions = req.body;

      if (!Array.isArray(transactions)) {
        logger.debug('Webhook received non-array body');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      logger.info(`Processing ${transactions.length} transactions from webhook`);

      const db = getDatabase();

      let processedCount = 0;

      for (const tx of transactions) {
        try {
          const result = await this.processSingleTransaction(db, tx);
          if (result.processed) {
            processedCount++;
          }
        } catch (error) {
          logger.error(`Error processing transaction ${tx.signature}:`, error);
        }
      }

      logger.info(`Webhook processing complete: ${processedCount}/${transactions.length} transactions processed`);
      return res.status(200).json({ processed: processedCount });

    } catch (error) {
      logger.error('Error in webhook controller:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async processSingleTransaction(db, tx) {
    try {
      // Validar estrutura da transação
      if (
        tx.type !== 'TRANSFER' ||
        tx.transactionError !== null ||
        !Array.isArray(tx.tokenTransfers) ||
        tx.tokenTransfers.length > 0 ||
        !Array.isArray(tx.nativeTransfers) ||
        tx.nativeTransfers.length !== 1
      ) {
        logger.debug(`Skipping transaction ${tx.signature} - invalid structure`);
        return { processed: false, reason: 'invalid_structure' };
      }

      const transfer = tx.nativeTransfers[0];
      const toAddress = transfer.toUserAccount;
      const fromAddress = transfer.fromUserAccount;
      const amount = transfer.amount;
      const signature = tx.signature;

      // Verificar se é um depósito para nossa carteira
      if (toAddress !== config.APP_PUBLIC_KEY) {
        logger.debug(`Skipping transaction ${signature} - not to our wallet`);
        return { processed: false, reason: 'not_our_wallet' };
      }

      // Verificar se o valor corresponde a um valor de chip válido
      if (!(amount in config.LAMPORTS_TO_CHIPS)) {
        logger.debug(`Skipping transaction ${signature} - invalid chip amount: ${amount}`);
        return { processed: false, reason: 'invalid_amount' };
      }

      // Verificar se já processamos esta transação
      const existingTransaction = await this.transactionModel.findBySignature(db, signature);
      if (existingTransaction) {
        logger.debug(`Transaction ${signature} already processed`);
        return { processed: false, reason: 'already_processed' };
      }

      // Buscar usuário pela carteira
      const user = await this.userModel.findByWallet(db, fromAddress);
      if (!user) {
        logger.warn(`Transaction ${signature} from unregistered wallet: ${fromAddress}`);
        return { processed: false, reason: 'user_not_found' };
      }

      // Calcular fichas e creditar ao usuário
      const chips = config.LAMPORTS_TO_CHIPS[amount];
      await this.userModel.addBalance(db, user.id, chips);

      // Registrar transação
      await this.transactionModel.create(
        db,
        signature,
        user.id,
        amount / LAMPORTS_PER_SOL,
        fromAddress,
        toAddress
      );

      logger.info(`✅ ${chips} chips credited to ${user.name} (${user.wallet}) - deposit of ${(amount / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

      return {
        processed: true,
        user: user.name,
        chips,
        amount: amount / LAMPORTS_PER_SOL
      };

    } catch (error) {
      logger.error('Error processing single transaction:', error);
      throw error;
    }
  }

  async getWebhookStats(req, res) {
    try {
      const db = getDatabase();

      const [userStats, transactionStats, appBalance] = await Promise.all([
        this.userModel.getStats(db),
        this.transactionModel.getStats(db, config.APP_PUBLIC_KEY),
        this.getAppWalletBalance()
      ]);

      return res.json({
        users: userStats,
        transactions: transactionStats,
        appWallet: {
          balance: appBalance.sol,
          lamports: appBalance.lamports,
          publicKey: appBalance.publicKey
        },
        config: {
          chipPrice: config.CHIP_PRICE_LAMPORTS,
          supportedAmounts: Object.keys(config.LAMPORTS_TO_CHIPS)
        }
      });

    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAppWalletBalance() {
    try {
      const { getAppWalletBalance } = await import('../services/solana/balanceService.js');
      return await getAppWalletBalance();
    } catch (error) {
      logger.error('Error getting app wallet balance for stats:', error);
      return { sol: 0, lamports: 0, publicKey: config.APP_PUBLIC_KEY };
    }
  }
}

export const webhookController = new WebhookController();
