-- =====================================================
-- Simple Profiles Table - No Authentication Required
-- =====================================================
-- This is a simplified version without Supabase Auth
-- Users are stored directly in profiles table
-- =====================================================

-- Drop existing table if it exists (be careful - this deletes all data!)
-- DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 1. CREATE SIMPLIFIED PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
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

-- =====================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CREATE RLS POLICIES
-- =====================================================

-- Policy 1: Public read access (everyone can view profiles)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (true);  -- Simplified: any authenticated user can update (we'll handle auth in app)

-- Policy 3: Admins can do everything
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

-- Policy 4: Allow inserts (for creating new users)
CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 4. ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- =====================================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);

-- =====================================================
-- 6. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREATE FUNCTION TO HASH PASSWORDS (Optional - for server-side hashing)
-- =====================================================
-- Note: In the app, we'll use a simple approach or bcrypt
-- For now, passwords will be hashed in the application

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. No foreign key to auth.users - completely independent
-- 2. username is unique - used for login
-- 3. password_hash stores hashed passwords (use bcrypt or similar)
-- 4. No email field - not needed
-- 5. Simple login: username + password
-- 6. All users stored in profiles table
-- =====================================================
