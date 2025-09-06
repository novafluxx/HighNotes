# Cryptography Utilities Documentation

## Overview

The High Notes application includes a comprehensive client-side encryption system implemented in `app/composables/useCrypto.ts`. This system provides end-to-end encryption for note content using industry-standard cryptographic primitives.

## Features

### 🔐 Encryption System
- **Algorithm**: AES-GCM (256-bit) for authenticated encryption
- **Key Derivation**: Argon2id for password-based key derivation
- **Compression**: Gzip compression before encryption to reduce data size
- **Per-Note Encryption**: Each note uses a unique Data Encryption Key (DEK)
- **Key Wrapping**: DEK is wrapped with master key using AES-GCM

### 🛡️ Security Features
- **Cryptographically Secure Random Numbers**: Uses `crypto.getRandomValues()` for all random generation
- **Salt Generation**: Unique salt for each key derivation
- **Tamper Detection**: Authenticated encryption prevents data tampering
- **No Plaintext Storage**: No plaintext or keys stored in persistent storage
- **Future-Proof Versioning**: Encrypted payload includes version for future compatibility

## Architecture

### Key Hierarchy
```
User Password → [Argon2id] → Master Key → [AES-GCM Key Wrapping] → DEK → [AES-GCM Encryption] → Encrypted Note
```

### Data Flow
1. **Key Derivation**: User password + salt → Master Key (Argon2id)
2. **DEK Generation**: Generate random 256-bit AES key per note
3. **Compression**: Gzip compress note content (title + body)
4. **Encryption**: Encrypt compressed data with DEK (AES-GCM)
5. **Key Wrapping**: Wrap DEK with Master Key (AES-GCM)
6. **Payload**: Combine encrypted data + wrapped DEK + metadata

## API Reference

### Core Functions

#### `deriveKey(params: KeyDerivationParams): Promise<CryptoKeyMaterial>`
Derives a master key from password using Argon2id.

**Parameters:**
- `password: string` - User password
- `salt?: Uint8Array` - Optional salt (generates random if not provided)
- `iterations?: number` - Argon2 iterations (default: 3)
- `memory?: number` - Argon2 memory in KB (default: 65536)
- `parallelism?: number` - Argon2 parallelism (default: 1)

**Returns:** `CryptoKeyMaterial` with derived key, salt, and iterations

#### `encryptNote(plaintext: PlaintextData, masterKey: CryptoKey): Promise<EncryptedPayload>`
Encrypts note content with compression and per-note DEK.

**Parameters:**
- `plaintext: PlaintextData` - Object with `title` and `content` strings
- `masterKey: CryptoKey` - Master key from `deriveKey()`

**Returns:** `EncryptedPayload` with encrypted data and metadata

#### `decryptNote(encryptedPayload: EncryptedPayload, masterKey: CryptoKey): Promise<PlaintextData>`
Decrypts note content and decompresses.

**Parameters:**
- `encryptedPayload: EncryptedPayload` - Encrypted payload from `encryptNote()`
- `masterKey: CryptoKey` - Same master key used for encryption

**Returns:** `PlaintextData` with decrypted title and content

### Utility Functions

#### `generateRandomBytes(size: number): Uint8Array`
Generates cryptographically secure random bytes.

#### `arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string`
Converts binary data to base64 string for storage/transmission.

#### `base64ToArrayBuffer(base64: string): Uint8Array`
Converts base64 string back to binary data.

#### `serializeEncryptedPayload(payload: EncryptedPayload): string`
Converts encrypted payload to JSON string for storage.

#### `parseEncryptedPayload(serialized: string): EncryptedPayload`
Parses JSON string back to encrypted payload object.

#### `testRoundTrip(password: string, testData: PlaintextData): Promise<boolean>`
Tests complete encryption/decryption cycle for validation.

## Data Structures

### EncryptedPayload
```typescript
interface EncryptedPayload {
  version: number;              // Format version (currently 1)
  algorithm: string;            // "AES-GCM"
  compression: string;          // "gzip"
  iv: string;                   // Base64-encoded IV
  encrypted_data: string;       // Base64-encoded encrypted content
  wrapped_dek: WrappedDEK;     // Wrapped Data Encryption Key
}
```

### WrappedDEK
```typescript
interface WrappedDEK {
  algorithm: string;            // "AES-GCM"
  iv: string;                   // Base64-encoded IV for key wrapping
  encrypted_key: string;        // Base64-encoded wrapped DEK
}
```

### PlaintextData
```typescript
interface PlaintextData {
  title: string;                // Note title
  content: string;              // Note content (HTML)
}
```

## Security Considerations

### Cryptographic Parameters
- **AES-GCM**: 256-bit keys with 96-bit (12-byte) IVs
- **Argon2id**: 3 iterations, 64MB memory, 1 thread (adjustable)
- **Salt Size**: 128-bit (16-byte) random salts
- **Key Size**: 256-bit keys for maximum security

### Threat Model
- ✅ **Data-at-Rest Protection**: Encrypted storage prevents data exposure
- ✅ **Data-in-Transit Protection**: Encrypted payloads safe during transmission
- ✅ **Tampering Detection**: Authenticated encryption detects modifications
- ✅ **Password Attacks**: Argon2id provides resistance to brute force
- ❌ **Memory Attacks**: No protection against memory dumping attacks
- ❌ **Side-Channel Attacks**: No specific mitigations implemented

### Best Practices
1. **Strong Passwords**: Use long, random passwords for master key derivation
2. **Secure Storage**: Never store master keys or passwords in persistent storage
3. **Key Rotation**: Consider periodic password changes
4. **Secure Deletion**: Clear sensitive data from memory when possible

## Usage Example

```typescript
import { useCrypto } from '~/app/composables/useCrypto';
import type { PlaintextData } from '~/app/types';

const crypto = useCrypto();

async function encryptAndStoreNote(password: string, noteData: PlaintextData) {
  // Derive master key from password
  const { key: masterKey, salt } = await crypto.deriveKey({ password });
  
  // Encrypt the note
  const encryptedPayload = await crypto.encryptNote(noteData, masterKey);
  
  // Serialize for storage
  const serializedPayload = crypto.serializeEncryptedPayload(encryptedPayload);
  
  // Store serializedPayload and salt separately
  return { encryptedData: serializedPayload, salt };
}

async function decryptNote(password: string, encryptedData: string, salt: Uint8Array) {
  // Derive the same master key
  const { key: masterKey } = await crypto.deriveKey({ password, salt });
  
  // Parse encrypted payload
  const encryptedPayload = crypto.parseEncryptedPayload(encryptedData);
  
  // Decrypt the note
  const decryptedNote = await crypto.decryptNote(encryptedPayload, masterKey);
  
  return decryptedNote;
}
```

## Testing

### Running Tests
```bash
# Open browser-based test
open crypto-test.html

# Or run in console (requires browser environment)
pnpm test:crypto
```

### Test Coverage
- ✅ Random number generation
- ✅ Base64 encoding/decoding
- ✅ Compression/decompression
- ✅ Key derivation with Argon2id
- ✅ DEK generation and wrapping
- ✅ Note encryption/decryption
- ✅ Unicode character handling
- ✅ Large content handling (100KB+)
- ✅ Error detection (wrong password, tampered data)
- ✅ Payload serialization/deserialization
- ✅ Round-trip validation

## Browser Compatibility

### Requirements
- **Web Crypto API**: Required for all cryptographic operations
- **ES2017+**: Async/await and modern JavaScript features
- **TextEncoder/TextDecoder**: For UTF-8 handling

### Supported Browsers
- ✅ Chrome 37+
- ✅ Firefox 34+
- ✅ Safari 7+
- ✅ Edge 12+
- ❌ Internet Explorer (not supported)

## Performance

### Benchmarks (approximate, varies by device)
- **Key Derivation**: ~500ms (Argon2id with 64MB memory)
- **Note Encryption**: ~1-5ms (depending on content size)
- **Note Decryption**: ~1-5ms (depending on content size)
- **Large Note (100KB)**: ~10-20ms encryption/decryption

### Optimization Notes
- Compression reduces encrypted payload size by ~60-80% for text content
- Per-note DEK ensures minimal performance impact for key derivation
- Async operations prevent UI blocking

## Future Enhancements

### Potential Improvements
1. **Web Workers**: Move crypto operations to background threads
2. **Key Caching**: Secure in-memory key caching with timeout
3. **Hardware Security**: Support for hardware security modules
4. **Algorithm Agility**: Support for multiple encryption algorithms
5. **Forward Secrecy**: Implement key rotation mechanisms

### Migration Support
The versioned payload format allows for future algorithm upgrades while maintaining backward compatibility with existing encrypted data.