// src/models/User.js
import { logger } from '../utils/logger.js';

export class User {
  async create(db, userId, wallet, name) {
    try {
      // Verificar se usuário já existe pelo ID
      const existingUserById = await db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (existingUserById) {
        return { success: true, exists: true, data: existingUserById, reason: 'user_exists' };
      }

      // Verificar se a carteira já está sendo usada por outro usuário
      const existingUserByWallet = await db.get(
        'SELECT * FROM users WHERE wallet = ?',
        [wallet]
      );

      if (existingUserByWallet) {
        logger.warn(`Attempt to register duplicate wallet: ${wallet} by user ${userId}. Wallet belongs to user ${existingUserByWallet.id}`);
        return { 
          success: false, 
          exists: false, 
          error: 'wallet_already_registered',
          data: existingUserByWallet,
          reason: 'wallet_exists'
        };
      }

      // Criar novo usuário
      await db.run(
        'INSERT INTO users (id, wallet, name, balance, created_at, updated_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [userId, wallet, name]
      );

      logger.info(`User created: ${userId} with wallet ${wallet}`);
      return { success: true, exists: false, reason: 'created' };

    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findById(db, userId) {
    try {
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      return user;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByWallet(db, wallet) {
    try {
      const user = await db.get('SELECT * FROM users WHERE wallet = ?', [wallet]);
      return user;
    } catch (error) {
      logger.error('Error finding user by wallet:', error);
      throw error;
    }
  }

  async updateBalance(db, userId, newBalance) {
    try {
      await db.run(
        'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, userId]
      );

      logger.debug(`Updated balance for user ${userId}: ${newBalance}`);
      return { success: true };

    } catch (error) {
      logger.error('Error updating user balance:', error);
      throw error;
    }
  }

  async addBalance(db, userId, amount) {
    try {
      await db.run(
        'UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [amount, userId]
      );

      logger.debug(`Added ${amount} to balance for user ${userId}`);
      return { success: true };

    } catch (error) {
      logger.error('Error adding to user balance:', error);
      throw error;
    }
  }

  async delete(db, userId) {
    try {
      await db.run('DELETE FROM users WHERE id = ?', [userId]);
      logger.info(`User deleted: ${userId}`);
      return { success: true };

    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAll(db, limit = 100, offset = 0) {
    try {
      const users = await db.all(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return users;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getStats(db) {
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(balance) as totalBalance,
          AVG(balance) as avgBalance,
          MAX(balance) as maxBalance,
          MIN(balance) as minBalance
        FROM users
      `);
      
      return stats;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}