// src/services/solana/balanceService.js
import { createSolanaClient, address, lamports } from '@solana/kit';
import base58 from 'bs58';
import config from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

const { getBalance, getLatestBlockhash } = createSolanaClient({ url: config.SOLANA_RPC });
const APP_KEYPAIR_ADDRESS = address(config.APP_PUBLIC_KEY || base58.encode(new Uint8Array()));

export async function getAppWalletBalance() {
  try {
    const result = await getBalance(APP_KEYPAIR_ADDRESS);
    const lamportsValue = Number(result.value);
    const sol = lamportsValue / 1e9;

    logger.debug(`App wallet balance: ${lamportsValue} lamports (${sol} SOL)`);

    return {
      lamports: lamportsValue,
      sol,
      publicKey: APP_KEYPAIR_ADDRESS
    };

  } catch (error) {
    logger.error('Error getting app wallet balance:', error);
    throw error;
  }
}

export async function getWalletBalance(publicKeyString) {
  try {
    const publicKey = address(publicKeyString);
    const result = await getBalance(publicKey);
    const lamportsValue = Number(result.value);
    const sol = lamportsValue / 1e9;

    return {
      lamports: lamportsValue,
      sol,
      publicKey: publicKeyString
    };

  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    throw error;
  }
}
