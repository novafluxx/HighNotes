// Define the structure of a Note object
export interface Note {
  id: string | null; // Can be null for newly created notes before saving
  user_id: string;
  title: string;
  content?: string | null; // Made optional
  created_at?: string; // Made optional (ISO string format)
  updated_at: string; // ISO string format from Supabase timestamp
}

// Cryptography-related interfaces
export interface EncryptedPayload {
  version: number; // Format version for future compatibility
  algorithm: string; // Encryption algorithm used (e.g., "AES-GCM")
  compression: string; // Compression method used (e.g., "gzip")
  iv: string; // Base64-encoded initialization vector
  encrypted_data: string; // Base64-encoded encrypted content
  wrapped_dek: WrappedDEK; // Wrapped Data Encryption Key
  auth_tag?: string; // Base64-encoded authentication tag (for AEAD modes)
}

export interface WrappedDEK {
  algorithm: string; // Key wrapping algorithm (e.g., "AES-GCM")
  iv: string; // Base64-encoded IV for key wrapping
  encrypted_key: string; // Base64-encoded wrapped DEK
  auth_tag?: string; // Base64-encoded authentication tag
}

export interface PlaintextData {
  title: string;
  content: string;
}

export interface CryptoKeyMaterial {
  key: CryptoKey;
  salt: Uint8Array;
  iterations: number;
}

export interface KeyDerivationParams {
  password: string;
  salt?: Uint8Array;
  iterations?: number;
  memory?: number; // Argon2 memory parameter
  parallelism?: number; // Argon2 parallelism parameter
}
