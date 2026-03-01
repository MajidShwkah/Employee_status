-- =====================================================
-- user_profiles Table Setup for Google Auth
-- =====================================================
-- Run this in Supabase SQL Editor if new users cannot log in
-- with Google. The app uses user_profiles (not profiles).
-- =====================================================

-- =====================================================
-- 1. CREATE user_profiles TABLE
-- =====================================================
-- Schema must match what AuthContext expects for new user creation
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  status TEXT CHECK (status IN ('free', 'busy')) DEFAULT 'free',
  status_note TEXT DEFAULT '',
  busy_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email column if table exists but is missing it (migration helper)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email')
  THEN
    ALTER TABLE user_profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add created_at if missing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_at')
  THEN
    ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add busy_until if missing (for status timer)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'busy_until')
  THEN
    ALTER TABLE user_profiles ADD COLUMN busy_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. DROP EXISTING POLICIES (if re-running)
-- =====================================================
DROP POLICY IF EXISTS "Public user_profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can do everything on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own user_profile" ON user_profiles;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Policy 1: Public read (for dashboard employee list)
CREATE POLICY "Public user_profiles are viewable by everyone"
ON user_profiles FOR SELECT
USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own user_profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: CRITICAL - Allow new users to insert their own profile on first Google login
CREATE POLICY "Users can insert own user_profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can manage all profiles (uses user_profiles for is_admin check)
CREATE OR REPLACE FUNCTION is_admin_user_profiles()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE POLICY "Admins can do everything on user_profiles"
ON user_profiles FOR ALL
USING (is_admin_user_profiles());

-- =====================================================
-- 5. ENABLE REALTIME
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- =====================================================
-- 6. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_status_idx ON user_profiles(status);
CREATE INDEX IF NOT EXISTS user_profiles_updated_at_idx ON user_profiles(updated_at);

-- =====================================================
-- 7. AUTO-UPDATE updated_at TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- =====================================================
-- DONE - New Google users can now create their profile
-- =====================================================
