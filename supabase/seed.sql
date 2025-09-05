-- Seed file for High Notes application with encryption support
-- This file provides initial setup documentation and can include test data

-- Example: How encryption is intended to work
/*

ENCRYPTION WORKFLOW:

1. User Profile Setup:
   - User enables encryption in their profile
   - Client generates encryption key from password + salt
   - Profile stores: has_encryption=true, encryption_salt, kdf_params

2. Creating Encrypted Notes:
   - Client encrypts title and content 
   - Stores encrypted data in encrypted_payload as JSON
   - Sets is_encrypted=true, title='', content=''
   - search_vector remains NULL (no search for encrypted notes)

3. Creating Non-Encrypted Notes:
   - Normal flow: title and content in plaintext
   - is_encrypted=false, encrypted_payload=NULL
   - search_vector populated for full-text search

4. Database Security:
   - RLS ensures users only access their own notes
   - Triggers validate encryption state consistency
   - Search only indexes non-encrypted content
   - API endpoints handle both modes transparently

EXAMPLE ENCRYPTED_PAYLOAD STRUCTURE:
{
  "title": "base64-encrypted-title",
  "content": "base64-encrypted-content", 
  "iv": "initialization-vector",
  "algorithm": "AES-GCM"
}

*/

-- You can add initial profiles or test data here when needed
-- INSERT INTO profiles (id, has_encryption) VALUES ...