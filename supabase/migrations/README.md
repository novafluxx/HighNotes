# Database Migration: Encrypted Notes Support

This migration adds support for per-note client-side encryption to the High Notes application.

## Migration Files

### 1. `20250905023659_add_encryption_support.sql`
- Adds `is_encrypted` (boolean) and `encrypted_payload` (jsonb) columns to notes table
- Adds `search_vector` column for full-text search if not exists
- Creates trigger to populate search_vector only for non-encrypted notes
- Updates existing notes to have search_vector populated
- Adds appropriate indexes and documentation

### 2. `20250905023700_add_user_encryption_profile.sql`  
- Creates profiles table if not exists (linked to auth.users)
- Adds encryption columns: `has_encryption`, `encryption_salt`, `kdf_params`
- Sets up RLS policies for profile access
- Creates triggers for auto-creating profiles and updating timestamps
- Adds indexes for performance

### 3. `20250905023701_update_rls_policies.sql`
- Updates RLS policies for enhanced security with encrypted notes
- Creates validation triggers to ensure encryption state consistency
- Creates `notes_safe` view for safer note access
- Adds database-level protection against data leakage

## Security Model

### For Encrypted Notes:
- `is_encrypted = true`
- `title` and `content` fields are cleared (empty strings)
- All sensitive data stored in `encrypted_payload` JSON field
- `search_vector` is NULL (no full-text search for security)
- Only the note owner can access via RLS

### For Non-Encrypted Notes:
- `is_encrypted = false` 
- `title` and `content` contain plaintext
- `encrypted_payload` is NULL
- `search_vector` populated for full-text search
- Standard RLS applies

## Application Changes

### TypeScript Types
- Updated `types/database.types.ts` with new column definitions
- Added `UserProfile` interface in `app/types/index.ts`
- Extended `Note` interface with encryption fields

### Save Function
- Updated `supabase/functions/save-note/index.ts` to handle encrypted notes
- Validates encryption state and routes appropriately
- Maintains backward compatibility with existing notes

## Usage

The migration is designed to be backward compatible:
- Existing notes remain as `is_encrypted = false`
- Full-text search continues to work for non-encrypted notes
- New encrypted notes are properly isolated and secured
- Client applications can gradually adopt encryption features

## Security Considerations

- Encrypted payload format should be defined by client application
- Key derivation parameters stored in user profile (salt, iterations, etc.)
- Database never sees plaintext for encrypted notes
- Search functionality is intentionally disabled for encrypted notes
- RLS policies prevent cross-user data access