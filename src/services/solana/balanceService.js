// src/services/solana/balanceService.js
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import base58 from 'bs58';
import config from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

const connection = new Connection(config.SOLANA_RPC, 'confirmed');
const APP_KEYPAIR = Keypair.fromSecretKey(base58.decode(config.APP_SECRET_KEY));

export async function getAppWalletBalance() {
  try {
    const lamports = await connection.getBalance(APP_KEYPAIR.publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;

    logger.debug(`App wallet balance: ${lamports} lamports (${sol} SOL)`);

    return {
      lamports,
      sol,
      publicKey: APP_KEYPAIR.publicKey.toBase58()
    };

  } catch (error) {
    logger.error('Error getting app wallet balance:', error);
    throw error;
  }
}

export async function getWalletBalance(publicKeyString) {
  try {
    const publicKey = new PublicKey(publicKeyString);
    const lamports = await connection.getBalance(publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return {
      lamports,
      sol,
      publicKey: publicKeyString
    };

  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    throw error;
  }
}
console.log(await getAppWalletBalance())
