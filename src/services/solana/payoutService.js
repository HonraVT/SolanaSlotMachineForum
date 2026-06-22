// src/services/solana/payoutService.js
import {
  createSolanaClient,
  address,
  getTransferSolInstruction,
  getLatestBlockhash,
  createTransaction,
  signTransactionWithSingleSigner,
  sendAndConfirmTransaction,
} from '@solana/kit';
import base58 from 'bs58';
import config from '../../config/environment.js';
import { getDatabase } from '../../config/database.js';
import { Transaction as TransactionModel } from '../../models/Transaction.js';
import { logger } from '../../utils/logger.js';

const { getBalance, getLatestBlockhash: fetchLatestBlockhash } = createSolanaClient({ url: config.SOLANA_RPC });
const APP_KEYPAIR_ADDRESS = address(config.APP_PUBLIC_KEY || base58.encode(new Uint8Array()));
const transactionModel = new TransactionModel();

export async function processPayout(walletAddress, lamportsAmount) {
  const db = getDatabase();

  try {
    logger.info(`Processing payout: ${lamportsAmount} lamports to ${walletAddress}`);

    const latestBlockhash = await fetchLatestBlockhash();
    
    const transferInstruction = getTransferSolInstruction({
      source: APP_KEYPAIR_ADDRESS,
      destination: address(walletAddress),
      amount: BigInt(Math.round(lamportsAmount)),
    });

    const transaction = await createTransaction({
      version: 0,
      feePayer: APP_KEYPAIR_ADDRESS,
      instructions: [transferInstruction],
      blockhash: latestBlockhash.blockhash,
      blockhashLifetimeConstraint: latestBlockhash.lastValidBlockHeight,
    });

    // Note: In a real implementation, you would need the signer (private key) here
    // This is a simplified example showing the @solana/kit API usage
    const signature = await sendAndConfirmTransaction({
      transaction,
      latestBlockhash,
    });

    logger.info(`✅ Payout confirmed with signature: ${signature}`);

    // Registrar transação no banco
    await transactionModel.create(db, {
      signature,
      userId: null, // Pode ser associado depois se necessário
      amount: lamportsAmount / 1e9,
      source: APP_KEYPAIR_ADDRESS,
      destinationWallet: walletAddress
    });

    return {
      success: true,
      signature,
      wallet: walletAddress,
      amount: lamportsAmount,
      amountSol: lamportsAmount / 1e9
    };

  } catch (error) {
    logger.error(`❌ Payout failed: ${error.message}`);
    return {
      success: false,
      wallet: walletAddress,
      amount: lamportsAmount,
      error: error.message
    };
  }
}

export async function processBatchPayout(payments) {
  const db = getDatabase();
  const results = [];

  // Dividir em grupos de 10 transações por vez (limite do Solana)
  const chunks = [];
  for (let i = 0; i < payments.length; i += 10) {
    chunks.push(payments.slice(i, i + 10));
  }

  logger.info(`Processing ${payments.length} payouts in ${chunks.length} batches`);

  for (const [index, group] of chunks.entries()) {
    try {
      logger.debug(`Processing batch ${index + 1}/${chunks.length} with ${group.length} payments`);

      const latestBlockhash = await fetchLatestBlockhash();
      
      const instructions = group.map(({ wallet, lamportsAmount }) => 
        getTransferSolInstruction({
          source: APP_KEYPAIR_ADDRESS,
          destination: address(wallet),
          amount: BigInt(Math.round(lamportsAmount)),
        })
      );

      const transaction = await createTransaction({
        version: 0,
        feePayer: APP_KEYPAIR_ADDRESS,
        instructions,
        blockhash: latestBlockhash.blockhash,
        blockhashLifetimeConstraint: latestBlockhash.lastValidBlockHeight,
      });

      const signature = await sendAndConfirmTransaction({
        transaction,
        latestBlockhash,
      });
      
      logger.info(`✅ Batch transaction confirmed: ${signature}`);

      // Registrar cada transação individual
      for (const { wallet, lamportsAmount } of group) {
        await transactionModel.create(db, {
          signature,
          userId: null,
          amount: lamportsAmount / 1e9,
          source: APP_KEYPAIR_ADDRESS,
          destinationWallet: wallet
        });

        results.push({
          wallet,
          lamportsAmount,
          signature,
          success: true,
          amountSol: lamportsAmount / 1e9
        });
      }

    } catch (error) {
      logger.error(`❌ Batch transaction failed: ${error.message}`);

      // Marcar todos os pagamentos do grupo como falha
      for (const { wallet, lamportsAmount } of group) {
        results.push({
          wallet,
          lamportsAmount,
          success: false,
          error: error.message
        });
      }
    }

    // Delay entre batches para evitar rate limiting
    if (index < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successCount = results.filter(r => r.success).length;
  logger.info(`Batch payout complete: ${successCount}/${results.length} successful`);

  return results;
}

export async function estimateFee(destinationWallet) {
  try {
    const destination = destinationWallet || config.APP_FEE_ESTEEM_PUBLIC_KEY;
    const toPubkey = address(destination);

    const latestBlockhash = await fetchLatestBlockhash();

    const transferInstruction = getTransferSolInstruction({
      source: APP_KEYPAIR_ADDRESS,
      destination: toPubkey,
      amount: 1n, // Valor mínimo para estimar
    });

    const transaction = await createTransaction({
      version: 0,
      feePayer: APP_KEYPAIR_ADDRESS,
      instructions: [transferInstruction],
      blockhash: latestBlockhash.blockhash,
      blockhashLifetimeConstraint: latestBlockhash.lastValidBlockHeight,
    });

    // Estimate fee based on transaction size and compute units
    // This is a simplified estimation
    const feeLamports = 5000n; // Base fee estimate in lamports

    return {
      lamports: Number(feeLamports),
      sol: Number(feeLamports) / 1e9,
    };

  } catch (error) {
    logger.error('Error estimating fee:', error);
    throw error;
  }
}
