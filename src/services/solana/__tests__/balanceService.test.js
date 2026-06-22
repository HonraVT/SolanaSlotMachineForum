// src/services/solana/__tests__/balanceService.test.js
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createSolanaClient } from '@solana/kit';
import * as balanceService from '../balanceService.js';

// Mock the @solana/kit module
const originalCreateSolanaClient = createSolanaClient;
const mockGetBalance = mock.fn();
const mockGetLatestBlockhash = mock.fn();

// Mock dependencies
const mockConfig = {
  SOLANA_RPC: 'https://api.devnet.solana.com',
  APP_PUBLIC_KEY: 'TestPublicKey1234567890123456789012345',
};

const mockLogger = {
  debug: mock.fn(),
  error: mock.fn(),
  info: mock.fn(),
};

// Apply mocks before importing the service
mock.method(globalThis, 'createSolanaClient', () => ({
  getBalance: mockGetBalance,
  getLatestBlockhash: mockGetLatestBlockhash,
}));

describe('balanceService', () => {
  beforeEach(() => {
    mockGetBalance.mock.resetCalls();
    mockGetLatestBlockhash.mock.resetCalls();
    mockLogger.debug.mock.resetCalls();
    mockLogger.error.mock.resetCalls();
    mockLogger.info.mock.resetCalls();
  });

  describe('getAppWalletBalance', () => {
    it('should return balance in lamports and SOL for app wallet', async () => {
      const mockLamports = BigInt(1500000000); // 1.5 SOL
      mockGetBalance.mock.mockImplementation(async () => ({ value: mockLamports }));

      const result = await balanceService.getAppWalletBalance();

      assert.strictEqual(result.lamports, 1500000000);
      assert.strictEqual(result.sol, 1.5);
      assert.strictEqual(result.publicKey, 'TestPublicKey1234567890123456789012345');
      assert.strictEqual(mockGetBalance.mock.callCount(), 1);
    });

    it('should handle zero balance', async () => {
      mockGetBalance.mock.mockImplementation(async () => ({ value: BigInt(0) }));

      const result = await balanceService.getAppWalletBalance();

      assert.strictEqual(result.lamports, 0);
      assert.strictEqual(result.sol, 0);
      assert.strictEqual(result.publicKey, 'TestPublicKey1234567890123456789012345');
    });

    it('should throw error when getBalance fails', async () => {
      const error = new Error('Connection failed');
      mockGetBalance.mock.mockImplementation(async () => { throw error; });

      await assert.rejects(
        () => balanceService.getAppWalletBalance(),
        (err) => {
          assert.strictEqual(err.message, 'Connection failed');
          return true;
        }
      );
    });

    it('should log debug information on success', async () => {
      mockGetBalance.mock.mockImplementation(async () => ({ value: BigInt(2000000000) }));

      await balanceService.getAppWalletBalance();

      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      const callArgs = mockLogger.debug.mock.calls[0].arguments;
      assert.ok(callArgs[0].includes('App wallet balance'));
    });
  });

  describe('getWalletBalance', () => {
    it('should return balance for a given public key', async () => {
      const testPublicKey = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
      const mockLamports = BigInt(500000000); // 0.5 SOL
      mockGetBalance.mock.mockImplementation(async () => ({ value: mockLamports }));

      const result = await balanceService.getWalletBalance(testPublicKey);

      assert.strictEqual(result.lamports, 500000000);
      assert.strictEqual(result.sol, 0.5);
      assert.strictEqual(result.publicKey, testPublicKey);
    });

    it('should handle different balance amounts', async () => {
      const testPublicKey = 'TestWallet12345678901234567890123456';
      mockGetBalance.mock.mockImplementation(async () => ({ value: BigInt(100000000) }));

      const result = await balanceService.getWalletBalance(testPublicKey);

      assert.strictEqual(result.sol, 0.1);
      assert.strictEqual(result.lamports, 100000000);
    });

    it('should throw error when invalid public key is provided', async () => {
      const error = new Error('Invalid address');
      mockGetBalance.mock.mockImplementation(async () => { throw error; });

      await assert.rejects(
        () => balanceService.getWalletBalance('invalid-key'),
        (err) => {
          assert.strictEqual(err.message, 'Invalid address');
          return true;
        }
      );
    });

    it('should propagate errors from getBalance', async () => {
      const testPublicKey = 'TestWallet12345678901234567890123456';
      const error = new Error('RPC timeout');
      mockGetBalance.mock.mockImplementation(async () => { throw error; });

      await assert.rejects(
        () => balanceService.getWalletBalance(testPublicKey),
        (err) => {
          assert.strictEqual(err.message, 'RPC timeout');
          return true;
        }
      );
    });
  });
});
