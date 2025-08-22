// src/services/solana/validationService.js
import { PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger.js';

export function validateWallet(walletString) {
  try {
    if (!walletString || typeof walletString !== 'string') {
      return false;
    }

    // Tentar criar PublicKey - se falhar, é inválida
    new PublicKey(walletString);
    return true;

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