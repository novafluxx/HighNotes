-- Add encryption support to notes table
-- This migration adds columns for per-note encryption while maintaining backward compatibility

-- Add encryption columns to notes table
ALTER TABLE notes 
ADD COLUMN is_encrypted boolean NOT NULL DEFAULT false,
ADD COLUMN encrypted_payload jsonb;

-- Add search_vector column if it doesn't exist (for full-text search)
-- This ensures compatibility with the existing textSearch functionality
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'search_vector') THEN
        ALTER TABLE notes ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create or replace function to update search vector
-- This function will only index non-encrypted notes for security
CREATE OR REPLACE FUNCTION update_notes_search_vector()
RETURNS trigger AS $$
BEGIN
    -- Only update search vector for non-encrypted notes
    IF NEW.is_encrypted = false THEN
        NEW.search_vector := to_tsvector('english', 
            COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')
        );
    ELSE
        -- Clear search vector for encrypted notes to prevent data leakage
        NEW.search_vector := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS notes_search_vector_trigger ON notes;
CREATE TRIGGER notes_search_vector_trigger
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_notes_search_vector();

-- Create index on search_vector for performance (only for non-encrypted notes)
DROP INDEX IF EXISTS notes_search_vector_idx;
CREATE INDEX notes_search_vector_idx ON notes USING gin(search_vector)
WHERE search_vector IS NOT NULL;

-- Update existing rows to populate search_vector for non-encrypted notes
UPDATE notes 
SET search_vector = to_tsvector('english', 
    COALESCE(title, '') || ' ' || COALESCE(content, '')
)
WHERE is_encrypted = false;

-- Add comment for documentation
COMMENT ON COLUMN notes.is_encrypted IS 'Flag indicating if note content is encrypted';
COMMENT ON COLUMN notes.encrypted_payload IS 'JSON payload containing encrypted note data when is_encrypted=true';
COMMENT ON COLUMN notes.search_vector IS 'Full-text search vector, only populated for non-encrypted notes';