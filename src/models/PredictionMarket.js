// src/models/PredictionMarket.js
import { logger } from '../utils/logger.js';

export class PredictionMarket {
  async create(db, question, createdBy, closesAt = null) {
    try {
      const result = await db.run(
        'INSERT INTO prediction_markets (question, status, createdBy, closesAt, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [question, 'open', createdBy, closesAt]
      );

      logger.info(`Prediction market created: ${result.lastID} - ${question}`);
      return this.findById(db, result.lastID);
    } catch (error) {
      logger.error('Error creating prediction market:', error);
      throw error;
    }
  }

  async findById(db, marketId) {
    try {
      return await db.get('SELECT * FROM prediction_markets WHERE id = ?', [marketId]);
    } catch (error) {
      logger.error('Error finding prediction market by ID:', error);
      throw error;
    }
  }

  async getOpen(db, limit = 10) {
    try {
      return await db.all(
        'SELECT * FROM prediction_markets WHERE status = ? ORDER BY created_at DESC LIMIT ?',
        ['open', limit]
      );
    } catch (error) {
      logger.error('Error listing open prediction markets:', error);
      throw error;
    }
  }

  async resolve(db, marketId, winningOption) {
    try {
      await db.run(
        'UPDATE prediction_markets SET status = ?, winningOption = ?, resolvedAt = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        ['resolved', winningOption, marketId, 'open']
      );

      return this.findById(db, marketId);
    } catch (error) {
      logger.error('Error resolving prediction market:', error);
      throw error;
    }
  }

  async getStats(db, marketId) {
    try {
      const stats = await db.get(
        `SELECT
          COALESCE(SUM(stake), 0) as totalPool,
          COALESCE(SUM(CASE WHEN option = 'yes' THEN stake ELSE 0 END), 0) as yesPool,
          COALESCE(SUM(CASE WHEN option = 'no' THEN stake ELSE 0 END), 0) as noPool,
          COUNT(*) as predictionCount
        FROM predictions
        WHERE marketId = ?`,
        [marketId]
      );

      return stats;
    } catch (error) {
      logger.error('Error getting prediction market stats:', error);
      throw error;
    }
  }
}
