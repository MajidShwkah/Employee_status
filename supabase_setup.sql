-- =====================================================
-- Employee Status Dashboard - Complete Database Setup
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================
-- This table stores employee profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  status TEXT CHECK (status IN ('free', 'busy')) DEFAULT 'free',
  status_note TEXT,
  busy_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE RLS POLICIES
-- =====================================================

-- Policy 1: Public read access (everyone can view profiles)
-- This allows the public dashboard to display all employees
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Policy 2: Users can update their own profile
-- This allows employees to update their own status
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Helper function to check if user is admin (avoids infinite recursion)
-- SECURITY DEFINER allows it to bypass RLS when checking
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Policy 3: Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
-- This allows admins to manage all employees
-- Uses helper function to avoid infinite recursion
CREATE POLICY "Admins can do everything"
ON profiles FOR ALL
USING (is_admin());

-- Policy 4: Allow authenticated users to insert their own profile
-- This is needed when creating new users via the admin panel
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. ENABLE REALTIME
-- =====================================================
-- This enables real-time updates so changes appear instantly
-- across all connected clients
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- =====================================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE (OPTIONAL)
-- =====================================================
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);

-- =====================================================
-- 6. CREATE FUNCTION TO AUTO-UPDATE updated_at TIMESTAMP (OPTIONAL)
-- =====================================================
-- This automatically updates the updated_at field whenever a row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to use the function
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (Run these to check your setup)
-- =====================================================

-- Check if table exists and see its structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check if realtime is enabled
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles';

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. The 'auth.users' table is automatically created by Supabase Auth
-- 2. When you create a user via supabase.auth.signUp(), it automatically
--    creates a row in auth.users
-- 3. Your app then creates a corresponding row in the profiles table
-- 4. The id in profiles table matches the id in auth.users
-- 5. RLS policies ensure security at the database level
-- 6. Realtime allows instant updates across all connected clients
-- =====================================================
