// src/models/Transaction.js
import { logger } from '../utils/logger.js';

export class Transaction {
  async create(db, signature, userId, amount, source, destinationWallet) {
    try {
      await db.run(
        'INSERT INTO transactions (signature, userId, amount, source, destinationWallet, processedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [signature, userId, amount, source, destinationWallet]
      );

      logger.debug(`Transaction record created: ${signature}`);
      return { success: true };

    } catch (error) {
      logger.error('Error creating transaction record:', error);
      throw error;
    }
  }

  async findBySignature(db, signature) {
    try {
      const transaction = await db.get(
        'SELECT * FROM transactions WHERE signature = ?',
        [signature]
      );
      return transaction;
    } catch (error) {
      logger.error('Error finding transaction by signature:', error);
      throw error;
    }
  }

  async findByUserId(db, userId, limit = 20) {
    try {
      const transactions = await db.all(
        'SELECT * FROM transactions WHERE userId = ? ORDER BY processedAt DESC LIMIT ?',
        [userId, limit]
      );
      return transactions;
    } catch (error) {
      logger.error('Error finding transactions by user ID:', error);
      throw error;
    }
  }

  async findByWallet(db, wallet, limit = 20) {
    try {
      const transactions = await db.all(
        'SELECT * FROM transactions WHERE source = ? OR destinationWallet = ? ORDER BY processedAt DESC LIMIT ?',
        [wallet, wallet, limit]
      );
      return transactions;
    } catch (error) {
      logger.error('Error finding transactions by wallet:', error);
      throw error;
    }
  }

  async getAll(db, limit = 100, offset = 0) {
    try {
      const transactions = await db.all(
        'SELECT * FROM transactions ORDER BY processedAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return transactions;
    } catch (error) {
      logger.error('Error getting all transactions:', error);
      throw error;
    }
  }

  async delete(db, signature) {
    try {
      await db.run('DELETE FROM transactions WHERE signature = ?', [signature]);
      logger.debug(`Transaction record deleted: ${signature}`);
      return { success: true };

    } catch (error) {
      logger.error('Error deleting transaction record:', error);
      throw error;
    }
  }

  async getStats(db, appPublicKey) {
    try {
      if (!appPublicKey) {
        throw new Error("appPublicKey is required for getTransactionStats");
      }

      const totalDepositsRow = await db.get(
        'SELECT SUM(amount) as total FROM transactions WHERE destinationWallet = ?',
        [appPublicKey]
      );

      const totalWithdrawalsRow = await db.get(
        'SELECT SUM(amount) as total FROM transactions WHERE source = ?',
        [appPublicKey]
      );

      const totalTransactions = await db.get(
        'SELECT COUNT(*) as count FROM transactions'
      );

      const recentTransactions = await db.get(
        'SELECT COUNT(*) as count FROM transactions WHERE processedAt > datetime("now", "-24 hours")'
      );

      return {
        totalDeposits: totalDepositsRow.total || 0,
        totalWithdrawals: totalWithdrawalsRow.total || 0,
        netFlow: (totalDepositsRow.total || 0) - (totalWithdrawalsRow.total || 0),
        totalTransactions: totalTransactions.count || 0,
        recentTransactions: recentTransactions.count || 0
      };

    } catch (error) {
      logger.error('Error getting transaction stats:', error);
      throw error;
    }
  }

  async getDepositsByTimeframe(db, appPublicKey, timeframe = '24 hours') {
    try {
      const deposits = await db.all(
        `SELECT 
           DATE(processedAt) as date,
           SUM(amount) as totalAmount,
           COUNT(*) as transactionCount
         FROM transactions 
         WHERE destinationWallet = ? 
           AND processedAt > datetime("now", "-${timeframe}")
         GROUP BY DATE(processedAt)
         ORDER BY date DESC`,
        [appPublicKey]
      );

      return deposits;
    } catch (error) {
      logger.error('Error getting deposits by timeframe:', error);
      throw error;
    }
  }

  async getWithdrawalsByTimeframe(db, appPublicKey, timeframe = '24 hours') {
    try {
      const withdrawals = await db.all(
        `SELECT 
           DATE(processedAt) as date,
           SUM(amount) as totalAmount,
           COUNT(*) as transactionCount
         FROM transactions 
         WHERE source = ? 
           AND processedAt > datetime("now", "-${timeframe}")
         GROUP BY DATE(processedAt)
         ORDER BY date DESC`,
        [appPublicKey]
      );

      return withdrawals;
    } catch (error) {
      logger.error('Error getting withdrawals by timeframe:', error);
      throw error;
    }
  }
}
