// src/config/environment.js
import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  PORT: process.env.PORT || 3000,
  WEBHOOK_PATH: process.env.WEBHOOK_PATH || '/webhook',

  // Authentication
  AUTH_HEADER: process.env.AUTH_HEADER || 'Bearer default-token',

  // Solana
  SOLANA_RPC: process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
  APP_PUBLIC_KEY: process.env.APP_PUBLIC_KEY,
  APP_SECRET_KEY: process.env.APP_SECRET_KEY,
  APP_FEE_ESTEEM_PUBLIC_KEY: process.env.APP_FEE_ESTEEM_PUBLIC_KEY,

  // Game
  CHIP_PRICE_LAMPORTS: parseInt(process.env.CHIP_PRICE_LAMPORTS) || 100000,
  LAMPORTS_TO_CHIPS: JSON.parse(process.env.LAMPORTS_TO_CHIPS || '{}'),
  QRCODES: JSON.parse(process.env.QRCODES || '[]'),
  SYMBOL_WEIGHTS: JSON.parse(process.env.SYMBOL_WEIGHTS || '{}'),
  PAYOUT_TABLE: JSON.parse(process.env.PAYOUT_TABLE || '{}'),
  SYMBOLS_EMOJI: JSON.parse(process.env.SYMBOLS_EMOJI || '{}'),

  // Prediction Markets
  ADMIN_USER_IDS: (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean),

  // Forum
  FORUM_URL: process.env.FORUM_URL,
  FORUM_XF_USER_COOKIE: process.env.FORUM_XF_USER_COOKIE,
  BOT_NAME: process.env.BOT_NAME || 'Win-Win⠀Situation',
  LANGUAGE: process.env.LANGUAGE || 'pt_br',

  // Welcome Message Settings
  WELCOME_MESSAGE_TITLE: process.env.WELCOME_MESSAGE_TITLE || "Solana's Slot Machine",

  // Bot Settings
  BOT_INTERVAL_MS: process.env.BOT_INTERVAL_MS || 20000, // 20 segundos
  BOT_FLOOD_DELAY: process.env.BOT_FLOOD_DELAY || 30000, // 30 segundos

  // Log
  LOG_LEVEL: process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
};

// Validação de variáveis obrigatórias
const requiredVars = [
  'APP_PUBLIC_KEY',
  'APP_SECRET_KEY',
  'FORUM_URL',
  'FORUM_XF_USER_COOKIE'
];

for (const varName of requiredVars) {
  if (!config[varName]) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
}

export default config;
