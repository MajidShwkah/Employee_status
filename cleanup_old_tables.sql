-- =====================================================
-- Cleanup Old Tables - Remove Auth and Old Profiles
-- =====================================================
-- WARNING: This will DELETE ALL DATA!
-- Run this only if you want to start fresh
-- =====================================================

-- =====================================================
-- STEP 1: Remove Policies First (before dropping table)
-- =====================================================
-- Drop all policies on profiles (they'll be recreated with new table)
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

-- =====================================================
-- STEP 2: Drop Old Profiles Table
-- =====================================================
-- This removes the old profiles table that had foreign key to auth.users
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- STEP 3: Drop Helper Functions
-- =====================================================
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- STEP 4: Remove from Realtime Publication
-- =====================================================
-- Remove old profiles table from realtime (if it was added)
-- Note: This may fail if table wasn't in publication - that's okay
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
EXCEPTION
    WHEN undefined_object THEN
        -- Table wasn't in publication, that's fine
        NULL;
END $$;

-- =====================================================
-- STEP 5: Drop Indexes (if they exist)
-- =====================================================
DROP INDEX IF EXISTS profiles_role_idx;
DROP INDEX IF EXISTS profiles_status_idx;
DROP INDEX IF EXISTS profiles_updated_at_idx;
DROP INDEX IF EXISTS profiles_username_idx;

-- =====================================================
-- STEP 6: About auth.users Table
-- =====================================================
-- NOTE: You CANNOT drop auth.users table directly via SQL
-- The auth.users table is managed by Supabase Auth system
-- 
-- Options:
-- 1. Leave it (it won't interfere with new system)
-- 2. Delete users manually via Supabase Dashboard:
--    - Go to Authentication → Users
--    - Delete users one by one
-- 3. Use Supabase Management API to delete users
--
-- The auth.users table will remain but won't be used
-- by your new simplified system

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, verify tables are dropped:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name = 'profiles';
-- (Should return nothing)

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- After running this cleanup script:
-- 1. Run simple_profiles_setup.sql to create new table
-- 2. Create your first admin user
-- 3. Start using the simplified system

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- ⚠️ This script DELETES ALL DATA in profiles table
-- ⚠️ Make sure you have backups if needed
-- ⚠️ auth.users table cannot be dropped (Supabase managed)
-- ⚠️ auth.users will remain but won't be used
-- =====================================================
