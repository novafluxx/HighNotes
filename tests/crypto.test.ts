// tests/crypto.test.ts
import { describe, it, expect, beforeAll } from '@nuxt/test-utils';
import { useCrypto } from '~/app/composables/useCrypto';
import type { PlaintextData } from '~/app/types';

// Mock Web Crypto API for testing environment
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = await import('crypto');
  global.crypto = webcrypto as any;
}

describe('useCrypto', () => {
  let crypto: ReturnType<typeof useCrypto>;
  
  beforeAll(() => {
    crypto = useCrypto();
  });

  describe('Basic Crypto Operations', () => {
    it('should generate random bytes', () => {
      const bytes1 = crypto.generateRandomBytes(16);
      const bytes2 = crypto.generateRandomBytes(16);
      
      expect(bytes1).toHaveLength(16);
      expect(bytes2).toHaveLength(16);
      expect(bytes1).not.toEqual(bytes2); // Should be random
    });

    it('should convert between base64 and array buffer', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = crypto.arrayBufferToBase64(original);
      const decoded = crypto.base64ToArrayBuffer(base64);
      
      expect(decoded).toEqual(original);
    });

    it('should compress and decompress data', () => {
      const original = 'This is a test string with some content to compress!';
      const compressed = crypto.compressData(original);
      const decompressed = crypto.decompressData(compressed);
      
      expect(decompressed).toBe(original);
      expect(compressed.length).toBeLessThan(original.length); // Should compress
    });
  });

  describe('Key Derivation', () => {
    it('should derive key from password', async () => {
      const password = 'test-password-123';
      const keyMaterial = await crypto.deriveKey({ password });
      
      expect(keyMaterial.key).toBeInstanceOf(CryptoKey);
      expect(keyMaterial.salt).toHaveLength(crypto.SALT_SIZE);
      expect(keyMaterial.iterations).toBeGreaterThan(0);
    });

    it('should derive same key with same password and salt', async () => {
      const password = 'test-password-123';
      const salt = crypto.generateRandomBytes(crypto.SALT_SIZE);
      
      const keyMaterial1 = await crypto.deriveKey({ password, salt });
      const keyMaterial2 = await crypto.deriveKey({ password, salt });
      
      // Extract key material for comparison
      const exported1 = await crypto.subtle.exportKey('raw', keyMaterial1.key);
      const exported2 = await crypto.subtle.exportKey('raw', keyMaterial2.key);
      
      expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
    });

    it('should derive different keys with different passwords', async () => {
      const salt = crypto.generateRandomBytes(crypto.SALT_SIZE);
      
      const keyMaterial1 = await crypto.deriveKey({ password: 'password1', salt });
      const keyMaterial2 = await crypto.deriveKey({ password: 'password2', salt });
      
      const exported1 = await crypto.subtle.exportKey('raw', keyMaterial1.key);
      const exported2 = await crypto.subtle.exportKey('raw', keyMaterial2.key);
      
      expect(new Uint8Array(exported1)).not.toEqual(new Uint8Array(exported2));
    });
  });

  describe('DEK Operations', () => {
    it('should generate DEK', async () => {
      const dek = await crypto.generateDEK();
      expect(dek).toBeInstanceOf(CryptoKey);
      expect(dek.algorithm.name).toBe('AES-GCM');
    });

    it('should wrap and unwrap DEK', async () => {
      const password = 'test-password';
      const { key: masterKey } = await crypto.deriveKey({ password });
      const dek = await crypto.generateDEK();
      
      const wrappedDEK = await crypto.wrapDEK(dek, masterKey);
      const unwrappedDEK = await crypto.unwrapDEK(wrappedDEK, masterKey);
      
      expect(wrappedDEK.algorithm).toBe(crypto.ENCRYPTION_ALGORITHM);
      expect(wrappedDEK.iv).toBeTruthy();
      expect(wrappedDEK.encrypted_key).toBeTruthy();
      expect(unwrappedDEK).toBeInstanceOf(CryptoKey);
    });
  });

  describe('Note Encryption/Decryption', () => {
    const testPassword = 'secure-password-123';
    const testData: PlaintextData = {
      title: 'Test Note Title',
      content: 'This is the content of the test note with some special characters: éñü'
    };

    it('should encrypt and decrypt note content', async () => {
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      
      const encrypted = await crypto.encryptNote(testData, masterKey);
      const decrypted = await crypto.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(testData);
    });

    it('should create valid encrypted payload structure', async () => {
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(testData, masterKey);
      
      expect(encrypted.version).toBe(crypto.CRYPTO_VERSION);
      expect(encrypted.algorithm).toBe(crypto.ENCRYPTION_ALGORITHM);
      expect(encrypted.compression).toBe(crypto.COMPRESSION_METHOD);
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.encrypted_data).toBeTruthy();
      expect(encrypted.wrapped_dek).toBeTruthy();
      expect(encrypted.wrapped_dek.algorithm).toBe(crypto.ENCRYPTION_ALGORITHM);
    });

    it('should serialize and parse encrypted payload', async () => {
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(testData, masterKey);
      
      const serialized = crypto.serializeEncryptedPayload(encrypted);
      const parsed = crypto.parseEncryptedPayload(serialized);
      const decrypted = await crypto.decryptNote(parsed, masterKey);
      
      expect(decrypted).toEqual(testData);
    });

    it('should handle unicode characters correctly', async () => {
      const unicodeData: PlaintextData = {
        title: '测试标题 🚀 Ñoté',
        content: 'Unicode content: 你好世界 🌍 עברית العربية Русский'
      };
      
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(unicodeData, masterKey);
      const decrypted = await crypto.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(unicodeData);
    });

    it('should handle large notes', async () => {
      const largeContent = 'A'.repeat(100000); // 100KB of content
      const largeData: PlaintextData = {
        title: 'Large Note',
        content: largeContent
      };
      
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(largeData, masterKey);
      const decrypted = await crypto.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(largeData);
    });

    it('should fail with wrong password', async () => {
      const { key: masterKey1 } = await crypto.deriveKey({ password: 'password1' });
      const { key: masterKey2 } = await crypto.deriveKey({ password: 'password2' });
      
      const encrypted = await crypto.encryptNote(testData, masterKey1);
      
      await expect(crypto.decryptNote(encrypted, masterKey2)).rejects.toThrow();
    });

    it('should fail with tampered data', async () => {
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(testData, masterKey);
      
      // Tamper with encrypted data
      const tamperedPayload = { ...encrypted };
      tamperedPayload.encrypted_data = 'tampered-data';
      
      await expect(crypto.decryptNote(tamperedPayload, masterKey)).rejects.toThrow();
    });

    it('should fail with unsupported version', async () => {
      const { key: masterKey } = await crypto.deriveKey({ password: testPassword });
      const encrypted = await crypto.encryptNote(testData, masterKey);
      
      // Change version to unsupported
      const unsupportedPayload = { ...encrypted, version: 999 };
      
      await expect(crypto.decryptNote(unsupportedPayload, masterKey)).rejects.toThrow('Unsupported payload version');
    });
  });

  describe('Round Trip Test', () => {
    it('should pass round trip test', async () => {
      const testData: PlaintextData = {
        title: 'Round Trip Test',
        content: 'Testing complete encryption/decryption cycle'
      };
      
      const result = await crypto.testRoundTrip('test-password', testData);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid base64', () => {
      expect(() => crypto.base64ToArrayBuffer('invalid-base64!')).toThrow();
    });

    it('should handle invalid JSON in parseEncryptedPayload', () => {
      expect(() => crypto.parseEncryptedPayload('invalid-json')).toThrow();
    });

    it('should handle missing fields in parseEncryptedPayload', () => {
      const incompletePayload = JSON.stringify({ version: 1 });
      expect(() => crypto.parseEncryptedPayload(incompletePayload)).toThrow();
    });

    it('should handle empty password', async () => {
      await expect(crypto.deriveKey({ password: '' })).rejects.toThrow();
    });
  });
});