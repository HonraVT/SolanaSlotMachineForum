// src/services/solana/payoutService.js
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import base58 from 'bs58';
import config from '../../config/environment.js';
import { getDatabase } from '../../config/database.js';
import { Transaction as TransactionModel } from '../../models/Transaction.js';
import { logger } from '../../utils/logger.js';

const connection = new Connection(config.SOLANA_RPC, 'confirmed');
const APP_KEYPAIR = Keypair.fromSecretKey(base58.decode(config.APP_SECRET_KEY));
const transactionModel = new TransactionModel();

export async function processPayout(walletAddress, lamportsAmount) {
  const db = getDatabase();

  try {
    logger.info(`Processing payout: ${lamportsAmount} lamports to ${walletAddress}`);

    const transaction = new Transaction();

    transaction.add(SystemProgram.transfer({
      fromPubkey: APP_KEYPAIR.publicKey,
      toPubkey: new PublicKey(walletAddress),
      lamports: Math.round(lamportsAmount),
    }));

    const signature = await sendAndConfirmTransaction(connection, transaction, [APP_KEYPAIR]);
    logger.info(`✅ Payout confirmed with signature: ${signature}`);

    // Registrar transação no banco
    await transactionModel.create(db, {
      signature,
      userId: null, // Pode ser associado depois se necessário
      amount: lamportsAmount / LAMPORTS_PER_SOL,
      source: APP_KEYPAIR.publicKey.toBase58(),
      destinationWallet: walletAddress
    });

    return {
      success: true,
      signature,
      wallet: walletAddress,
      amount: lamportsAmount,
      amountSol: lamportsAmount / LAMPORTS_PER_SOL
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

      const transaction = new Transaction();

      // Adicionar todas as transferências do grupo
      for (const { wallet, lamportsAmount } of group) {
        transaction.add(SystemProgram.transfer({
          fromPubkey: APP_KEYPAIR.publicKey,
          toPubkey: new PublicKey(wallet),
          lamports: Math.round(lamportsAmount),
        }));
      }

      const signature = await sendAndConfirmTransaction(connection, transaction, [APP_KEYPAIR]);
      logger.info(`✅ Batch transaction confirmed: ${signature}`);

      // Registrar cada transação individual
      for (const { wallet, lamportsAmount } of group) {
        await transactionModel.create(db, {
          signature,
          userId: null,
          amount: lamportsAmount / LAMPORTS_PER_SOL,
          source: APP_KEYPAIR.publicKey.toBase58(),
          destinationWallet: wallet
        });

        results.push({
          wallet,
          lamportsAmount,
          signature,
          success: true,
          amountSol: lamportsAmount / LAMPORTS_PER_SOL
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
    const toPubkey = new PublicKey(destination);

    const { blockhash } = await connection.getLatestBlockhash();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: APP_KEYPAIR.publicKey,
        toPubkey,
        lamports: 1, // Valor mínimo para estimar
      })
    );

    transaction.feePayer = APP_KEYPAIR.publicKey;
    transaction.recentBlockhash = blockhash;

    const message = transaction.compileMessage();
    const { value: feeLamports } = await connection.getFeeForMessage(message);

    return {
      lamports: feeLamports,
      sol: feeLamports / LAMPORTS_PER_SOL,
    };

  } catch (error) {
    logger.error('Error estimating fee:', error);
    throw error;
  }
}
