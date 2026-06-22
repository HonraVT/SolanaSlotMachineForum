// src/services/solana/validationService.js
import { address, isAddress } from '@solana/kit';
import { logger } from '../../utils/logger.js';

export function validateWallet(walletString) {
  try {
    if (!walletString || typeof walletString !== 'string') {
      return false;
    }

    // Use @solana/kit's isAddress to validate wallet format
    return isAddress(walletString);

  } catch (error) {
    logger.debug(`Invalid wallet format: ${walletString}`, error.message);
    return false;
  }
}

export function validateAmount(amount) {
  try {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
  } catch (error) {
    return false;
  }
}

export function validateSignature(signature) {
  try {
    // Signature básica da Solana tem 88 caracteres base58
    return typeof signature === 'string' && signature.length >= 80 && signature.length <= 90;
  } catch (error) {
    return false;
  }
}