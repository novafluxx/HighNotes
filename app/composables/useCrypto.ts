// app/composables/useCrypto.ts
import { argon2id } from '@noble/hashes/argon2';
import { deflate, inflate } from 'pako';
import type { 
  EncryptedPayload, 
  WrappedDEK, 
  PlaintextData, 
  CryptoKeyMaterial,
  KeyDerivationParams 
} from '~/app/types';

// Constants for cryptographic parameters
const CRYPTO_VERSION = 1;
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const COMPRESSION_METHOD = 'gzip';
const KEY_SIZE = 256; // bits
const IV_SIZE = 12; // bytes for AES-GCM
const SALT_SIZE = 16; // bytes
const ARGON2_ITERATIONS = 3; // Default iterations
const ARGON2_MEMORY = 65536; // 64MB in KB
const ARGON2_PARALLELISM = 1; // Single thread

export function useCrypto() {
  /**
   * Generate cryptographically secure random bytes
   */
  const generateRandomBytes = (size: number): Uint8Array => {
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
      throw new Error('Web Crypto API not available');
    }
    return crypto.getRandomValues(new Uint8Array(size));
  };

  /**
   * Convert Uint8Array to base64 string
   */
  const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  /**
   * Convert base64 string to Uint8Array
   */
  const base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  /**
   * Derive master key from password using Argon2id
   */
  const deriveKey = async (params: KeyDerivationParams): Promise<CryptoKeyMaterial> => {
    const {
      password,
      salt = generateRandomBytes(SALT_SIZE),
      iterations = ARGON2_ITERATIONS,
      memory = ARGON2_MEMORY,
      parallelism = ARGON2_PARALLELISM
    } = params;

    // Validate password: must be at least 8 characters and not empty
    if (typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    try {
      // Use Argon2id to derive key material
      const keyMaterial = argon2id(password, salt, {
        t: iterations,
        m: memory,
        p: parallelism,
        dkLen: KEY_SIZE / 8 // Convert bits to bytes
      });

      // Import the derived key material as a CryptoKey
      const key = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false, // not extractable
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
      );

      return {
        key,
        salt,
        iterations
      };
    } catch (error) {
      throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Generate a random Data Encryption Key (DEK)
   */
  const generateDEK = async (): Promise<CryptoKey> => {
    try {
      return await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: KEY_SIZE
        },
        true, // extractable for wrapping
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(`DEK generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Wrap (encrypt) a DEK with a master key
   */
  const wrapDEK = async (dek: CryptoKey, masterKey: CryptoKey): Promise<WrappedDEK> => {
    try {
      const iv = generateRandomBytes(IV_SIZE);
      
      const wrappedKey = await crypto.subtle.wrapKey(
        'raw',
        dek,
        masterKey,
        {
          name: 'AES-GCM',
          iv: iv
        }
      );

      return {
        algorithm: ENCRYPTION_ALGORITHM,
        iv: arrayBufferToBase64(iv),
        encrypted_key: arrayBufferToBase64(wrappedKey)
      };
    } catch (error) {
      throw new Error(`DEK wrapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Unwrap (decrypt) a DEK with a master key
   */
  const unwrapDEK = async (wrappedDEK: WrappedDEK, masterKey: CryptoKey): Promise<CryptoKey> => {
    try {
      const iv = base64ToArrayBuffer(wrappedDEK.iv);
      const encryptedKey = base64ToArrayBuffer(wrappedDEK.encrypted_key);

      return await crypto.subtle.unwrapKey(
        'raw',
        encryptedKey,
        masterKey,
        {
          name: 'AES-GCM',
          iv: iv
        },
        { name: 'AES-GCM' },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new Error(`DEK unwrapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Compress data using gzip
   */
  const compressData = (data: string): Uint8Array => {
    try {
      const encoder = new TextEncoder();
      const utf8Data = encoder.encode(data);
      return deflate(utf8Data);
    } catch (error) {
      throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Decompress gzip data
   */
  const decompressData = (compressedData: Uint8Array): string => {
    try {
      const decompressed = inflate(compressedData);
      const decoder = new TextDecoder();
      return decoder.decode(decompressed);
    } catch (error) {
      throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Encrypt plaintext data using AES-GCM
   */
  const encryptData = async (data: string, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> => {
    try {
      const iv = generateRandomBytes(IV_SIZE);
      const encoder = new TextEncoder();
      const plaintextBytes = encoder.encode(data);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        plaintextBytes
      );

      return { encrypted, iv };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Decrypt data using AES-GCM
   */
  const decryptData = async (encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> => {
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Encrypt note content (title + content) with compression
   */
  const encryptNote = async (plaintext: PlaintextData, masterKey: CryptoKey): Promise<EncryptedPayload> => {
    try {
      // Combine title and content into JSON
      const plaintextJson = JSON.stringify(plaintext);
      
      // Compress the data
      const compressed = compressData(plaintextJson);
      
      // Generate DEK for this note
      const dek = await generateDEK();
      
      // Encrypt the compressed data with DEK
      const { encrypted, iv } = await encryptData(compressed, dek);
      
      // Wrap the DEK with master key
      const wrappedDEK = await wrapDEK(dek, masterKey);

      return {
        version: CRYPTO_VERSION,
        algorithm: ENCRYPTION_ALGORITHM,
        compression: COMPRESSION_METHOD,
        iv: arrayBufferToBase64(iv),
        encrypted_data: arrayBufferToBase64(encrypted),
        wrapped_dek: wrappedDEK
      };
    } catch (error) {
      throw new Error(`Note encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Decrypt note content with decompression
   */
  const decryptNote = async (encryptedPayload: EncryptedPayload, masterKey: CryptoKey): Promise<PlaintextData> => {
    try {
      // Verify version compatibility
      if (encryptedPayload.version !== CRYPTO_VERSION) {
        throw new Error(`Unsupported payload version: ${encryptedPayload.version}`);
      }

      // Verify algorithms
      if (encryptedPayload.algorithm !== ENCRYPTION_ALGORITHM) {
        throw new Error(`Unsupported encryption algorithm: ${encryptedPayload.algorithm}`);
      }

      if (encryptedPayload.compression !== COMPRESSION_METHOD) {
        throw new Error(`Unsupported compression method: ${encryptedPayload.compression}`);
      }

      // Unwrap the DEK
      const dek = await unwrapDEK(encryptedPayload.wrapped_dek, masterKey);
      
      // Decrypt the data
      const iv = base64ToArrayBuffer(encryptedPayload.iv);
      const encryptedData = base64ToArrayBuffer(encryptedPayload.encrypted_data);
      const decryptedCompressed = await decryptData(encryptedData, dek, iv);
      
      // Decompress the data
      const compressedBytes = base64ToArrayBuffer(decryptedCompressed);
      const plaintextJson = decompressData(compressedBytes);
      
      // Parse the JSON
      const plaintext = JSON.parse(plaintextJson) as PlaintextData;
      
      // Validate the structure
      if (typeof plaintext.title !== 'string' || typeof plaintext.content !== 'string') {
        throw new Error('Invalid decrypted data structure');
      }

      return plaintext;
    } catch (error) {
      throw new Error(`Note decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Serialize encrypted payload to JSON string
   */
  const serializeEncryptedPayload = (payload: EncryptedPayload): string => {
    try {
      return JSON.stringify(payload);
    } catch (error) {
      throw new Error(`Payload serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Parse encrypted payload from JSON string
   */
  const parseEncryptedPayload = (serialized: string): EncryptedPayload => {
    try {
      const payload = JSON.parse(serialized) as EncryptedPayload;
      
      // Validate required fields
      if (!payload.version || !payload.algorithm || !payload.compression || 
          !payload.iv || !payload.encrypted_data || !payload.wrapped_dek) {
        throw new Error('Invalid encrypted payload structure');
      }

      return payload;
    } catch (error) {
      throw new Error(`Payload parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Test if encryption/decryption works correctly (for development/testing)
   */
  const testRoundTrip = async (password: string, testData: PlaintextData): Promise<boolean> => {
    try {
      const keyMaterial = await deriveKey({ password });
      const encrypted = await encryptNote(testData, keyMaterial.key);
      const serialized = serializeEncryptedPayload(encrypted);
      const parsed = parseEncryptedPayload(serialized);
      const decrypted = await decryptNote(parsed, keyMaterial.key);
      
      return decrypted.title === testData.title && decrypted.content === testData.content;
    } catch (error) {
      console.error('Round trip test failed:', error);
      return false;
    }
  };

  return {
    // Key management
    deriveKey,
    generateDEK,
    wrapDEK,
    unwrapDEK,
    
    // Data processing
    compressData,
    decompressData,
    encryptData,
    decryptData,
    
    // High-level note operations
    encryptNote,
    decryptNote,
    
    // Payload handling
    serializeEncryptedPayload,
    parseEncryptedPayload,
    
    // Utilities
    generateRandomBytes,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    testRoundTrip,
    
    // Constants
    CRYPTO_VERSION,
    ENCRYPTION_ALGORITHM,
    COMPRESSION_METHOD,
    KEY_SIZE,
    IV_SIZE,
    SALT_SIZE
  };
}