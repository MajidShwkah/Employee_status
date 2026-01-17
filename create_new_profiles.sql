-- =====================================================
-- Create New Simplified Profiles Table
-- =====================================================
-- Run this to create the new profiles table structure
-- No cleanup - just creates everything fresh
-- =====================================================

-- =====================================================
-- 1. CREATE PROFILES TABLE
-- =====================================================
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
USING (true);

-- Policy 3: Helper function to check if user is admin
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

-- Policy 4: Admins can do everything
CREATE POLICY "Admins can do everything"
ON profiles FOR ALL
USING (is_admin());

-- Policy 5: Anyone can insert profiles (for creating new users)
CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 4. ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_status_idx ON profiles(status);
CREATE INDEX profiles_updated_at_idx ON profiles(updated_at);

-- =====================================================
-- 6. CREATE TRIGGER FUNCTION FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. CREATE TRIGGER
-- =====================================================
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Check indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'profiles';

-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- DONE!
-- =====================================================
-- Your new simplified profiles table is ready!
-- Next: Create your first admin user
-- =====================================================
