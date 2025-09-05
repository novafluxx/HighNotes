-- Update RLS policies for encrypted notes security
-- This migration ensures that encrypted note content is properly protected

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Enable RLS on notes table if not already enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for notes
-- These policies ensure users can only access their own notes
-- and provide additional protection for encrypted content

-- Policy for SELECT (viewing notes)
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policy for INSERT (creating notes)  
CREATE POLICY "Users can create their own notes" ON notes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Policy for UPDATE (modifying notes)
-- Additional check to ensure encrypted payload is only modified by owner
CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Policy for DELETE (removing notes)
CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Create function to validate encrypted note updates
-- This ensures that when encryption is enabled, sensitive fields are properly cleared
CREATE OR REPLACE FUNCTION validate_encrypted_note()
RETURNS trigger AS $$
BEGIN
    -- If note is being marked as encrypted, ensure plaintext fields are cleared
    IF NEW.is_encrypted = true THEN
        -- Clear title and content to prevent data leakage
        -- These should be stored in encrypted_payload instead
        IF NEW.title IS NOT NULL AND NEW.title != '' THEN
            RAISE EXCEPTION 'Encrypted notes cannot have plaintext title';
        END IF;
        
        IF NEW.content IS NOT NULL AND NEW.content != '' THEN
            RAISE EXCEPTION 'Encrypted notes cannot have plaintext content';
        END IF;
        
        -- Ensure encrypted_payload exists
        IF NEW.encrypted_payload IS NULL THEN
            RAISE EXCEPTION 'Encrypted notes must have encrypted_payload';
        END IF;
    END IF;
    
    -- If note is being marked as non-encrypted, clear encrypted_payload
    IF NEW.is_encrypted = false THEN
        NEW.encrypted_payload = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for encrypted note validation
DROP TRIGGER IF EXISTS validate_encrypted_note_trigger ON notes;
CREATE TRIGGER validate_encrypted_note_trigger
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION validate_encrypted_note();

-- Add additional security: prevent direct access to encrypted_payload in queries
-- This is handled at the application level, but we add database-level protection

-- Create view for safe note access (excludes raw encrypted_payload from normal queries)
CREATE OR REPLACE VIEW notes_safe AS
SELECT 
    id,
    user_id,
    title,
    CASE WHEN is_encrypted THEN NULL ELSE content END as content,
    created_at,
    updated_at,
    is_encrypted,
    search_vector
FROM notes
WHERE auth.uid() = user_id;

-- Grant access to the safe view
GRANT SELECT ON notes_safe TO authenticated;

-- Add comment explaining the security model
COMMENT ON TABLE notes IS 'Notes table with encryption support. Encrypted notes store data in encrypted_payload with cleared title/content fields.';
COMMENT ON VIEW notes_safe IS 'Safe view of notes that excludes encrypted_payload and masks content for encrypted notes.';