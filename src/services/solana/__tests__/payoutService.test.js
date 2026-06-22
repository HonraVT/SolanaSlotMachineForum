// src/services/solana/__tests__/payoutService.test.js
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import * as payoutService from '../payoutService.js';

// Mock the @solana/kit module
const mockSendAndConfirmTransaction = mock.fn();
const mockCreateTransaction = mock.fn();
const mockGetTransferSolInstruction = mock.fn();
const mockFetchLatestBlockhash = mock.fn();
const mockTransactionCreate = mock.fn();

// Mock dependencies
const mockConfig = {
  SOLANA_RPC: 'https://api.devnet.solana.com',
  APP_PUBLIC_KEY: 'TestPublicKey1234567890123456789012345',
  APP_FEE_ESTEEM_PUBLIC_KEY: 'FeeWallet12345678901234567890123456',
};

const mockLogger = {
  debug: mock.fn(),
  error: mock.fn(),
  info: mock.fn(),
};

const mockDb = {};

describe('payoutService', () => {
  beforeEach(() => {
    mockSendAndConfirmTransaction.mock.resetCalls();
    mockCreateTransaction.mock.resetCalls();
    mockGetTransferSolInstruction.mock.resetCalls();
    mockFetchLatestBlockhash.mock.resetCalls();
    mockTransactionCreate.mock.resetCalls();
    mockLogger.debug.mock.resetCalls();
    mockLogger.error.mock.resetCalls();
    mockLogger.info.mock.resetCalls();

    // Setup default mock implementations
    mockFetchLatestBlockhash.mock.mockImplementation(async () => ({
      blockhash: 'mockBlockhash12345678901234567890123456',
      lastValidBlockHeight: 1000,
    }));
    mockCreateTransaction.mock.mockImplementation(async () => ({}));
    mockSendAndConfirmTransaction.mock.mockImplementation(async () => 'mockSignature123456789012345678901234567890');
    mockGetTransferSolInstruction.mock.mockImplementation(() => ({}));
    mockTransactionCreate.mock.mockImplementation(async () => ({}));
  });

  describe('processPayout', () => {
    it('should process a single payout successfully', async () => {
      const walletAddress = 'RecipientWallet1234567890123456789012';
      const lamportsAmount = 1000000; // 0.001 SOL
      const mockSignature = 'mockSignature123456789012345678901234567890';

      mockSendAndConfirmTransaction.mock.mockImplementation(async () => mockSignature);

      const result = await payoutService.processPayout(walletAddress, lamportsAmount);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.signature, mockSignature);
      assert.strictEqual(result.wallet, walletAddress);
      assert.strictEqual(result.amount, lamportsAmount);
      assert.strictEqual(result.amountSol, lamportsAmount / 1e9);
    });

    it('should handle payout failure gracefully', async () => {
      const walletAddress = 'RecipientWallet1234567890123456789012';
      const lamportsAmount = 1000000;
      const error = new Error('Insufficient funds');

      mockFetchLatestBlockhash.mock.mockImplementation(async () => { throw error; });

      const result = await payoutService.processPayout(walletAddress, lamportsAmount);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Insufficient funds');
      assert.strictEqual(result.wallet, walletAddress);
    });

    it('should call getTransferSolInstruction with correct parameters', async () => {
      const walletAddress = 'RecipientWallet1234567890123456789012';
      const lamportsAmount = 2000000;

      await payoutService.processPayout(walletAddress, lamportsAmount);

      assert.strictEqual(mockGetTransferSolInstruction.mock.callCount(), 1);
      const callArgs = mockGetTransferSolInstruction.mock.calls[0].arguments[0];
      assert.strictEqual(callArgs.source, 'TestPublicKey1234567890123456789012345');
      assert.strictEqual(callArgs.destination, walletAddress);
      assert.strictEqual(callArgs.amount, BigInt(lamportsAmount));
    });

    it('should log success message on successful payout', async () => {
      await payoutService.processPayout('RecipientWallet1234567890123456789012', 1000000);

      assert.strictEqual(mockLogger.info.mock.callCount(), 1);
      const callArgs = mockLogger.info.mock.calls[0].arguments;
      assert.ok(callArgs[0].includes('✅ Payout confirmed'));
    });
  });

  describe('processBatchPayout', () => {
    it('should process multiple payouts in batches', async () => {
      const payments = [
        { wallet: 'Wallet1_1234567890123456789012345', lamportsAmount: 1000000 },
        { wallet: 'Wallet2_1234567890123456789012345', lamportsAmount: 2000000 },
        { wallet: 'Wallet3_1234567890123456789012345', lamportsAmount: 3000000 },
      ];
      const mockSignature = 'mockBatchSignature12345678901234567890';

      mockSendAndConfirmTransaction.mock.mockImplementation(async () => mockSignature);

      const results = await payoutService.processBatchPayout(payments);

      assert.strictEqual(results.length, 3);
      assert.strictEqual(results.every(r => r.success), true);
      assert.strictEqual(results[0].wallet, 'Wallet1_1234567890123456789012345');
      assert.strictEqual(results[1].wallet, 'Wallet2_1234567890123456789012345');
      assert.strictEqual(results[2].wallet, 'Wallet3_1234567890123456789012345');
    });

    it('should handle batch failures correctly', async () => {
      const payments = [
        { wallet: 'Wallet1_1234567890123456789012345', lamportsAmount: 1000000 },
        { wallet: 'Wallet2_1234567890123456789012345', lamportsAmount: 2000000 },
      ];
      const error = new Error('Batch transaction failed');

      mockFetchLatestBlockhash.mock.mockImplementation(async () => { throw error; });

      const results = await payoutService.processBatchPayout(payments);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results.every(r => !r.success), true);
      assert.strictEqual(results[0].error, 'Batch transaction failed');
    });

    it('should split large payment lists into chunks of 10', async () => {
      const payments = Array.from({ length: 25 }, (_, i) => ({
        wallet: `Wallet${i}_123456789012345678901234`,
        lamportsAmount: 1000000,
      }));

      await payoutService.processBatchPayout(payments);

      assert.strictEqual(mockLogger.info.mock.callCount(), 1);
      const callArgs = mockLogger.info.mock.calls[0].arguments;
      assert.ok(callArgs[0].includes('in 3 batches'));
    });
  });

  describe('estimateFee', () => {
    it('should return estimated fee in lamports and SOL', async () => {
      const result = await payoutService.estimateFee();

      assert.strictEqual(result.lamports, 5000);
      assert.strictEqual(result.sol, 5000 / 1e9);
    });

    it('should use custom destination wallet if provided', async () => {
      const customWallet = 'CustomFeeWallet123456789012345678901';
      
      await payoutService.estimateFee(customWallet);

      assert.strictEqual(mockGetTransferSolInstruction.mock.callCount(), 1);
      const callArgs = mockGetTransferSolInstruction.mock.calls[0].arguments[0];
      assert.strictEqual(callArgs.destination, customWallet);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Network error');
      mockFetchLatestBlockhash.mock.mockImplementation(async () => { throw error; });

      await assert.rejects(
        () => payoutService.estimateFee(),
        (err) => {
          assert.strictEqual(err.message, 'Network error');
          return true;
        }
      );
    });
  });
});
