// src/utils/helpers.js
import config from '../config/environment.js';
import { logger } from './logger.js';

/**
 * Converte string de símbolos para emojis
 * @param {string} input - String de símbolos (ex: "CHCHCH")
 * @returns {string} String de emojis correspondentes
 */
export function parseSymbolString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let result = '';

  for (let i = 0; i < input.length; i += 2) {
    const symbol = input.slice(i, i + 2);
    const emoji = config.SYMBOLS_EMOJI[symbol];

    if (emoji) {
      result += emoji;
    } else {
      logger.warn(`Unknown symbol: ${symbol}`);
      result += '❓'; // Emoji de interrogação para símbolos desconhecidos
    }
  }

  return result;
}