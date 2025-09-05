// Define the structure of a Note object
export interface Note {
  id: string | null; // Can be null for newly created notes before saving
  user_id: string;
  title: string;
  content?: string | null; // Made optional
  created_at?: string; // Made optional (ISO string format)
  updated_at: string; // ISO string format from Supabase timestamp
  is_encrypted?: boolean; // Indicates if note content is encrypted
  encrypted_payload?: any; // JSON payload for encrypted note data
  search_vector?: any; // Full-text search vector (only for non-encrypted notes)
}

// Define the structure for user encryption profile
export interface UserProfile {
  id: string;
  has_encryption: boolean;
  encryption_salt?: string | null;
  kdf_params?: any; // JSON parameters for key derivation
  created_at: string;
  updated_at: string;
}
