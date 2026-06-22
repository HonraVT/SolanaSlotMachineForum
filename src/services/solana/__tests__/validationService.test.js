// src/services/solana/__tests__/validationService.test.js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import * as validationService from '../validationService.js';

// Mock the @solana/kit module
const mockIsAddress = mock.fn((addr) => {
  // Simulate Solana address validation (44 character base58 string)
  if (typeof addr !== 'string') return false;
  // Valid Solana addresses are typically 32-44 characters
  return addr.length >= 32 && addr.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
});

// Mock logger
const mockLogger = {
  debug: mock.fn(),
};

describe('validationService', () => {
  describe('validateWallet', () => {
    it('should return true for valid Solana wallet address', () => {
      mockIsAddress.mock.mockImplementation(() => true);

      const validAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
      const result = validationService.validateWallet(validAddress);

      assert.strictEqual(result, true);
    });

    it('should return false for invalid wallet address', () => {
      mockIsAddress.mock.mockImplementation(() => false);

      const invalidAddress = 'invalid_wallet_address';
      const result = validationService.validateWallet(invalidAddress);

      assert.strictEqual(result, false);
    });

    it('should return false for empty string', () => {
      const result = validationService.validateWallet('');
      assert.strictEqual(result, false);
    });

    it('should return false for null input', () => {
      const result = validationService.validateWallet(null);
      assert.strictEqual(result, false);
    });

    it('should return false for undefined input', () => {
      const result = validationService.validateWallet(undefined);
      assert.strictEqual(result, false);
    });

    it('should return false for non-string input', () => {
      assert.strictEqual(validationService.validateWallet(123), false);
      assert.strictEqual(validationService.validateWallet({}), false);
      assert.strictEqual(validationService.validateWallet([]), false);
    });

    it('should return false for wallet address with invalid characters', () => {
      mockIsAddress.mock.mockImplementation(() => false);

      const invalidAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin!@#';
      const result = validationService.validateWallet(invalidAddress);

      assert.strictEqual(result, false);
    });

    it('should handle short strings correctly', () => {
      const result = validationService.validateWallet('abc');
      assert.strictEqual(result, false);
    });

    it('should log debug message for invalid wallets', () => {
      mockIsAddress.mock.mockImplementation(() => false);

      validationService.validateWallet('invalid');

      assert.strictEqual(mockLogger.debug.mock.callCount(), 1);
      const callArgs = mockLogger.debug.mock.calls[0].arguments;
      assert.ok(callArgs[0].includes('Invalid wallet format'));
    });
  });

  describe('validateAmount', () => {
    it('should return true for valid positive number', () => {
      assert.strictEqual(validationService.validateAmount(100), true);
      assert.strictEqual(validationService.validateAmount(0.5), true);
      assert.strictEqual(validationService.validateAmount('100'), true);
    });

    it('should return true for valid positive number string', () => {
      assert.strictEqual(validationService.validateAmount('50.5'), true);
    });

    it('should return false for zero', () => {
      assert.strictEqual(validationService.validateAmount(0), false);
      assert.strictEqual(validationService.validateAmount('0'), false);
    });

    it('should return false for negative numbers', () => {
      assert.strictEqual(validationService.validateAmount(-100), false);
      assert.strictEqual(validationService.validateAmount('-50'), false);
    });

    it('should return false for NaN', () => {
      assert.strictEqual(validationService.validateAmount(NaN), false);
      assert.strictEqual(validationService.validateAmount('abc'), false);
    });

    it('should return false for Infinity', () => {
      assert.strictEqual(validationService.validateAmount(Infinity), false);
      assert.strictEqual(validationService.validateAmount(-Infinity), false);
    });

    it('should return false for empty string', () => {
      assert.strictEqual(validationService.validateAmount(''), false);
    });

    it('should return false for null and undefined', () => {
      assert.strictEqual(validationService.validateAmount(null), false);
      assert.strictEqual(validationService.validateAmount(undefined), false);
    });

    it('should return false for objects and arrays', () => {
      assert.strictEqual(validationService.validateAmount({}), false);
      assert.strictEqual(validationService.validateAmount([]), false);
    });
  });

  describe('validateSignature', () => {
    it('should return true for valid signature length (80-90 chars)', () => {
      const validSignature = 'a'.repeat(88);
      assert.strictEqual(validationService.validateSignature(validSignature), true);

      const minValidSignature = 'a'.repeat(80);
      assert.strictEqual(validationService.validateSignature(minValidSignature), true);

      const maxValidSignature = 'a'.repeat(90);
      assert.strictEqual(validationService.validateSignature(maxValidSignature), true);
    });

    it('should return false for signature too short', () => {
      assert.strictEqual(validationService.validateSignature('a'.repeat(79)), false);
      assert.strictEqual(validationService.validateSignature('short'), false);
      assert.strictEqual(validationService.validateSignature(''), false);
    });

    it('should return false for signature too long', () => {
      assert.strictEqual(validationService.validateSignature('a'.repeat(91)), false);
      assert.strictEqual(validationService.validateSignature('a'.repeat(100)), false);
    });

    it('should return false for non-string input', () => {
      assert.strictEqual(validationService.validateSignature(123), false);
      assert.strictEqual(validationService.validateSignature(null), false);
      assert.strictEqual(validationService.validateSignature(undefined), false);
      assert.strictEqual(validationService.validateSignature({}), false);
    });

    it('should handle edge cases correctly', () => {
      // Exactly 80 characters
      assert.strictEqual(validationService.validateSignature('a'.repeat(80)), true);
      
      // Exactly 90 characters
      assert.strictEqual(validationService.validateSignature('a'.repeat(90)), true);
      
      // Exactly 88 characters (typical Solana signature)
      assert.strictEqual(validationService.validateSignature('a'.repeat(88)), true);
    });
  });
});
