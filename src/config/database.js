// src/config/database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { logger } from '../utils/logger.js';

let db;

export async function initDatabase() {
  try {
    db = await open({
      filename: './roulette.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet TEXT UNIQUE,
        name TEXT UNIQUE,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gameplay (
        messageId TEXT PRIMARY KEY,
        userId TEXT,
        messageText TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        signature TEXT PRIMARY KEY,
        userId TEXT,
        amount REAL,
        source TEXT,
        destinationWallet TEXT,
        processedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prediction_markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        winningOption TEXT,
        createdBy TEXT,
        closesAt DATETIME,
        resolvedAt DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marketId INTEGER NOT NULL,
        userId TEXT NOT NULL,
        option TEXT NOT NULL,
        stake REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        payout REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(marketId, userId),
        FOREIGN KEY(marketId) REFERENCES prediction_markets(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);
      CREATE INDEX IF NOT EXISTS idx_gameplay_userId ON gameplay(userId);
      CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
      CREATE INDEX IF NOT EXISTS idx_transactions_processedAt ON transactions(processedAt);
      CREATE INDEX IF NOT EXISTS idx_prediction_markets_status ON prediction_markets(status);
      CREATE INDEX IF NOT EXISTS idx_predictions_marketId ON predictions(marketId);
      CREATE INDEX IF NOT EXISTS idx_predictions_userId ON predictions(userId);
    `);

    logger.info('Database tables created/verified successfully');
    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    logger.info('Database connection closed');
  }
}
