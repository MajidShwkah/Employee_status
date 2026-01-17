-- =====================================================
-- Complete Cleanup and Fresh Start
-- =====================================================
-- This script does a complete cleanup and sets up new structure
-- WARNING: DELETES ALL EXISTING DATA!
-- =====================================================

-- =====================================================
-- PART 1: Cleanup Old Structure
-- =====================================================

-- Drop all policies first (before dropping table)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, that's fine
        NULL;
END $$;

-- Drop old profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove from realtime (if it was added)
-- Note: This may fail if table wasn't in publication - that's okay
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
EXCEPTION
    WHEN undefined_object THEN
        -- Table wasn't in publication, that's fine
        NULL;
END $$;

-- Drop indexes
DROP INDEX IF EXISTS profiles_role_idx;
DROP INDEX IF EXISTS profiles_status_idx;
DROP INDEX IF EXISTS profiles_updated_at_idx;
DROP INDEX IF EXISTS profiles_username_idx;

-- =====================================================
-- PART 2: Create New Simplified Structure
-- =====================================================

-- Create new simplified profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  status TEXT CHECK (status IN ('free', 'busy')) DEFAULT 'free',
  status_note TEXT,
  busy_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (true);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'
  );
END;
$$;

CREATE POLICY "Admins can do everything"
ON profiles FOR ALL
USING (is_admin());

CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Create Indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 3: About auth.users
-- =====================================================
-- The auth.users table is managed by Supabase Auth
-- You cannot drop it via SQL
-- 
-- It will remain but won't be used by the new system
-- You can ignore it or delete users via Dashboard

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check new table exists:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- =====================================================
-- CREATE FIRST ADMIN (Example)
-- =====================================================
-- After running this, create your first admin:
-- 
-- Option 1: Use the app (after creating one user via SQL)
-- Option 2: Insert via SQL (hash password first):
--
-- INSERT INTO profiles (username, password_hash, full_name, role, status)
-- VALUES (
--   'admin',
--   'your_hashed_password_here',  -- Use SHA-256 hash
--   'Admin User',
--   'admin',
--   'free'
-- );
--
-- To hash password, you can use the app's login page
-- or any SHA-256 hashing tool

-- =====================================================
-- DONE!
-- =====================================================
-- Your new simplified system is ready!
-- No more auth.users dependency
-- No more email requirements
-- Simple username/password login
-- =====================================================
