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

      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet);
      CREATE INDEX IF NOT EXISTS idx_gameplay_userId ON gameplay(userId);
      CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
      CREATE INDEX IF NOT EXISTS idx_transactions_processedAt ON transactions(processedAt);
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
