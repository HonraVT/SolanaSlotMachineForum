// src/models/GamePlay.js
import { logger } from '../utils/logger.js';

export class GamePlay {
  async create(db, messageId, userId, messageText, status) {
    try {
      await db.run(
        'INSERT INTO gameplay (messageId, userId, messageText, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [messageId, userId, messageText, status]
      );

      logger.debug(`GamePlay record created: ${messageId} for user ${userId}`);
      return { success: true };

    } catch (error) {
      logger.error('Error creating gameplay record:', error);
      throw error;
    }
  }

  async findByMessageId(db, messageId) {
    try {
      const gameplay = await db.get(
        'SELECT * FROM gameplay WHERE messageId = ?',
        [messageId]
      );
      return gameplay;
    } catch (error) {
      logger.error('Error finding gameplay by message ID:', error);
      throw error;
    }
  }

  async findByUserId(db, userId, limit = 10) {
    try {
      const gameplays = await db.all(
        'SELECT * FROM gameplay WHERE userId = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return gameplays;
    } catch (error) {
      logger.error('Error finding gameplay by user ID:', error);
      throw error;
    }
  }

  async updateStatus(db, messageId, newStatus) {
    try {
      await db.run(
        'UPDATE gameplay SET status = ? WHERE messageId = ?',
        [newStatus, messageId]
      );

      logger.debug(`GamePlay status updated: ${messageId} -> ${newStatus}`);
      return { success: true };

    } catch (error) {
      logger.error('Error updating gameplay status:', error);
      throw error;
    }
  }

  async delete(db, messageId) {
    try {
      await db.run('DELETE FROM gameplay WHERE messageId = ?', [messageId]);
      logger.debug(`GamePlay record deleted: ${messageId}`);
      return { success: true };

    } catch (error) {
      logger.error('Error deleting gameplay record:', error);
      throw error;
    }
  }

  async deleteAll(db) {
    try {
      await db.run('DELETE FROM gameplay');
      logger.info('All gameplay records deleted');
      return { success: true };

    } catch (error) {
      logger.error('Error deleting all gameplay records:', error);
      throw error;
    }
  }

  async getStats(db) {
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as totalGames,
          COUNT(CASE WHEN status = 'win' THEN 1 END) as totalWins,
          COUNT(CASE WHEN status = 'loss' THEN 1 END) as totalLosses,
          COUNT(DISTINCT userId) as uniquePlayers
        FROM gameplay
      `);

      if (stats.totalGames > 0) {
        stats.winRate = ((stats.totalWins / stats.totalGames) * 100).toFixed(2);
      } else {
        stats.winRate = 0;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting gameplay stats:', error);
      throw error;
    }
  }

  async getRecentActivity(db, limit = 50) {
    try {
      const activities = await db.all(`
        SELECT g.*, u.name as userName, u.wallet
        FROM gameplay g
        LEFT JOIN users u ON g.userId = u.id
        ORDER BY g.created_at DESC
        LIMIT ?
      `, [limit]);

      return activities;
    } catch (error) {
      logger.error('Error getting recent gameplay activity:', error);
      throw error;
    }
  }
}
