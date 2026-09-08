// src/models/Prediction.js
import { logger } from '../utils/logger.js';

export class Prediction {
  async create(db, marketId, userId, option, stake) {
    try {
      await db.run(
        'INSERT INTO predictions (marketId, userId, option, stake, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [marketId, userId, option, stake, 'open']
      );

      logger.info(`Prediction created: user ${userId}, market ${marketId}, option ${option}, stake ${stake}`);
      return { success: true };
    } catch (error) {
      logger.error('Error creating prediction:', error);
      throw error;
    }
  }

  async findByUserAndMarket(db, userId, marketId) {
    try {
      return await db.get(
        'SELECT * FROM predictions WHERE userId = ? AND marketId = ?',
        [userId, marketId]
      );
    } catch (error) {
      logger.error('Error finding prediction by user and market:', error);
      throw error;
    }
  }

  async findByMarket(db, marketId) {
    try {
      return await db.all(
        'SELECT * FROM predictions WHERE marketId = ? ORDER BY created_at ASC',
        [marketId]
      );
    } catch (error) {
      logger.error('Error listing predictions by market:', error);
      throw error;
    }
  }

  async markResolved(db, predictionId, status, payout = 0) {
    try {
      await db.run(
        'UPDATE predictions SET status = ?, payout = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, payout, predictionId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error marking prediction as resolved:', error);
      throw error;
    }
  }
}
