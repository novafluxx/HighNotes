-- Add user encryption profile support
-- This migration adds columns to store user encryption preferences and keys

-- Check if profiles table exists, if not create it
-- This ensures compatibility with Supabase Auth
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Enable RLS on profiles table
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for profiles - users can only access their own profile
        CREATE POLICY "Users can view their own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
        CREATE POLICY "Users can update their own profile" ON profiles  
            FOR UPDATE USING (auth.uid() = id);
        CREATE POLICY "Users can insert their own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Add encryption-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_encryption boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS encryption_salt text,
ADD COLUMN IF NOT EXISTS kdf_params jsonb;

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Create function to update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
CREATE TRIGGER profiles_updated_at_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN profiles.has_encryption IS 'Flag indicating if user has enabled client-side encryption';
COMMENT ON COLUMN profiles.encryption_salt IS 'Base64-encoded salt for key derivation (stored securely)';
COMMENT ON COLUMN profiles.kdf_params IS 'JSON parameters for key derivation function (algorithm, iterations, etc.)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS profiles_has_encryption_idx ON profiles(has_encryption);