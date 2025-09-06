// scripts/test-crypto.js
// Simple test runner for crypto functionality in Node.js environment
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running crypto functionality tests...\n');

async function runTests() {
  try {
    // Check if crypto is available
    if (typeof crypto === 'undefined') {
      console.log('❌ Web Crypto API not available in this environment');
      console.log('Note: Tests need to be run in a browser environment or with proper polyfills');
      process.exit(1);
    }

    // Import the crypto module 
    const cryptoModule = await import('../app/composables/useCrypto.ts');
    const { useCrypto } = cryptoModule;
    const cryptoUtils = useCrypto();

    let testsPassed = 0;
    let testsFailed = 0;

    function test(name, fn) {
      return async () => {
        try {
          await fn();
          console.log(`✅ ${name}`);
          testsPassed++;
        } catch (error) {
          console.log(`❌ ${name}: ${error.message}`);
          testsFailed++;
        }
      };
    }

    function expect(actual) {
      return {
        toBe: (expected) => {
          if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}`);
          }
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
          }
        },
        toHaveLength: (length) => {
          if (actual.length !== length) {
            throw new Error(`Expected length ${length}, got ${actual.length}`);
          }
        },
        toBeInstanceOf: (constructor) => {
          if (!(actual instanceof constructor)) {
            throw new Error(`Expected instance of ${constructor.name}, got ${typeof actual}`);
          }
        },
        toBeTruthy: () => {
          if (!actual) {
            throw new Error(`Expected truthy value, got ${actual}`);
          }
        },
        not: {
          toEqual: (expected) => {
            if (JSON.stringify(actual) === JSON.stringify(expected)) {
              throw new Error(`Expected not to equal ${JSON.stringify(expected)}`);
            }
          }
        }
      };
    }

    // Run basic tests
    await test('Generate random bytes', () => {
      const bytes1 = cryptoUtils.generateRandomBytes(16);
      const bytes2 = cryptoUtils.generateRandomBytes(16);
      
      expect(bytes1).toHaveLength(16);
      expect(bytes2).toHaveLength(16);
      expect(bytes1).not.toEqual(bytes2);
    })();

    await test('Base64 conversion', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = cryptoUtils.arrayBufferToBase64(original);
      const decoded = cryptoUtils.base64ToArrayBuffer(base64);
      
      expect(decoded).toEqual(original);
    })();

    await test('Compression/decompression', () => {
      const original = 'This is a test string with some content to compress!';
      const compressed = cryptoUtils.compressData(original);
      const decompressed = cryptoUtils.decompressData(compressed);
      
      expect(decompressed).toBe(original);
    })();

    await test('Key derivation', async () => {
      const password = 'test-password-123';
      const keyMaterial = await cryptoUtils.deriveKey({ password });
      
      expect(keyMaterial.key).toBeInstanceOf(CryptoKey);
      expect(keyMaterial.salt).toHaveLength(cryptoUtils.SALT_SIZE);
    })();

    await test('DEK generation and wrapping', async () => {
      const password = 'test-password';
      const { key: masterKey } = await cryptoUtils.deriveKey({ password });
      const dek = await cryptoUtils.generateDEK();
      
      const wrappedDEK = await cryptoUtils.wrapDEK(dek, masterKey);
      const unwrappedDEK = await cryptoUtils.unwrapDEK(wrappedDEK, masterKey);
      
      expect(wrappedDEK.algorithm).toBe(cryptoUtils.ENCRYPTION_ALGORITHM);
      expect(wrappedDEK.iv).toBeTruthy();
      expect(wrappedDEK.encrypted_key).toBeTruthy();
      expect(unwrappedDEK).toBeInstanceOf(CryptoKey);
    })();

    await test('Note encryption/decryption', async () => {
      const testPassword = 'secure-password-123';
      const testData = {
        title: 'Test Note Title',
        content: 'This is the content of the test note with some special characters: éñü'
      };

      const { key: masterKey } = await cryptoUtils.deriveKey({ password: testPassword });
      
      const encrypted = await cryptoUtils.encryptNote(testData, masterKey);
      const decrypted = await cryptoUtils.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(testData);
    })();

    await test('Unicode handling', async () => {
      const unicodeData = {
        title: '测试标题 🚀 Ñoté',
        content: 'Unicode content: 你好世界 🌍 עברית العربية Русский'
      };
      
      const { key: masterKey } = await cryptoUtils.deriveKey({ password: 'test' });
      const encrypted = await cryptoUtils.encryptNote(unicodeData, masterKey);
      const decrypted = await cryptoUtils.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(unicodeData);
    })();

    await test('Large notes handling', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB of content (reduced for faster test)
      const largeData = {
        title: 'Large Note',
        content: largeContent
      };
      
      const { key: masterKey } = await cryptoUtils.deriveKey({ password: 'test' });
      const encrypted = await cryptoUtils.encryptNote(largeData, masterKey);
      const decrypted = await cryptoUtils.decryptNote(encrypted, masterKey);
      
      expect(decrypted).toEqual(largeData);
    })();

    await test('Payload serialization', async () => {
      const testData = {
        title: 'Test',
        content: 'Content'
      };
      
      const { key: masterKey } = await cryptoUtils.deriveKey({ password: 'test' });
      const encrypted = await cryptoUtils.encryptNote(testData, masterKey);
      
      const serialized = cryptoUtils.serializeEncryptedPayload(encrypted);
      const parsed = cryptoUtils.parseEncryptedPayload(serialized);
      const decrypted = await cryptoUtils.decryptNote(parsed, masterKey);
      
      expect(decrypted).toEqual(testData);
    })();

    await test('Round trip test', async () => {
      const testData = {
        title: 'Round Trip Test',
        content: 'Testing complete encryption/decryption cycle'
      };
      
      const result = await cryptoUtils.testRoundTrip('test-password', testData);
      expect(result).toBe(true);
    })();

    // Test error conditions
    await test('Wrong password should fail', async () => {
      const testData = { title: 'Test', content: 'Content' };
      const { key: masterKey1 } = await cryptoUtils.deriveKey({ password: 'password1' });
      const { key: masterKey2 } = await cryptoUtils.deriveKey({ password: 'password2' });
      
      const encrypted = await cryptoUtils.encryptNote(testData, masterKey1);
      
      try {
        await cryptoUtils.decryptNote(encrypted, masterKey2);
        throw new Error('Should have failed with wrong password');
      } catch (error) {
        if (error.message === 'Should have failed with wrong password') {
          throw error;
        }
        // Expected to fail
      }
    })();

    await test('Tampered data should fail', async () => {
      const testData = { title: 'Test', content: 'Content' };
      const { key: masterKey } = await cryptoUtils.deriveKey({ password: 'test' });
      const encrypted = await cryptoUtils.encryptNote(testData, masterKey);
      
      // Tamper with encrypted data
      const tamperedPayload = { ...encrypted };
      tamperedPayload.encrypted_data = 'tampered-data';
      
      try {
        await cryptoUtils.decryptNote(tamperedPayload, masterKey);
        throw new Error('Should have failed with tampered data');
      } catch (error) {
        if (error.message === 'Should have failed with tampered data') {
          throw error;
        }
        // Expected to fail
      }
    })();

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total: ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Crypto functionality is working correctly.');
      console.log('\n📝 Summary of implemented features:');
      console.log('   • Argon2id-based key derivation');
      console.log('   • Random per-note DEK generation using crypto.getRandomValues');
      console.log('   • Gzip compression before encryption');
      console.log('   • AES-GCM (256-bit) encryption/decryption');
      console.log('   • DEK wrapping/unwrapping with master key');
      console.log('   • Encrypted payload JSON serialization');
      console.log('   • Round-trip encryption/decryption validation');
      console.log('   • Unicode and large content support');
      console.log('   • Tamper detection and error handling');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Failed to run tests:', error);
    console.log('\nNote: This test needs to be run in a browser environment or with Web Crypto API polyfills');
    process.exit(1);
  }
}

runTests();