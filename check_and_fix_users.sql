-- =====================================================
-- Check and Fix Foreign Key Constraint Error
-- =====================================================
-- This script helps you diagnose and fix the foreign key error
-- =====================================================

-- =====================================================
-- STEP 1: Check Existing Users in auth.users
-- =====================================================
-- Run this to see all users that exist in the auth system
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- STEP 2: Check Existing Profiles
-- =====================================================
-- Run this to see all profiles and their corresponding users
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.status,
    u.email,
    CASE 
        WHEN u.id IS NULL THEN '❌ Missing User'
        ELSE '✅ User Exists'
    END as user_status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- =====================================================
-- STEP 3: Find Orphaned Profiles (if any)
-- =====================================================
-- Profiles without corresponding auth users (shouldn't happen, but check)
SELECT 
    p.id,
    p.full_name,
    p.role
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- =====================================================
-- STEP 4: Create User First (if needed)
-- =====================================================
-- You cannot create users directly via SQL in Supabase
-- You must use one of these methods:

-- Option A: Supabase Dashboard
-- 1. Go to Authentication → Users
-- 2. Click "Add User" or "Invite User"
-- 3. Enter email and password
-- 4. Copy the generated user ID

-- Option B: Management API (using service role key)
/*
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "email_confirm": true
  }'
*/

-- Option C: Use your app's admin panel
-- The app handles user creation correctly

-- =====================================================
-- STEP 5: Create Profile (After User Exists)
-- =====================================================
-- Only run this AFTER you've created the user in auth.users
-- Replace 'USER_ID_FROM_AUTH_USERS' with actual UUID from Step 1

/*
INSERT INTO profiles (id, full_name, role, status, avatar_url)
VALUES (
  'USER_ID_FROM_AUTH_USERS',  -- Must exist in auth.users!
  'User Name',
  'employee',  -- or 'admin'
  'free',
  'https://ui-avatars.com/api/?name=User+Name&background=4F46E5&color=fff&size=128'
);
*/

-- =====================================================
-- STEP 6: Verify Everything is Correct
-- =====================================================
-- Run this to verify all profiles have corresponding users
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email,
    '✅ Valid' as status
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
ORDER BY p.full_name;

-- =====================================================
-- COMMON SCENARIOS
-- =====================================================

-- Scenario 1: You're trying to create a profile with a non-existent ID
-- Solution: Create the user first, then use that ID

-- Scenario 2: You copied the wrong ID
-- Solution: Run Step 1 to get the correct user IDs

-- Scenario 3: User was deleted but profile still exists
-- Solution: Delete the orphaned profile or recreate the user

-- Scenario 4: Using your app to create users
-- Solution: Your app code is correct - it creates user first, then profile
-- If it's failing, check:
--   - Email confirmation might be required
--   - Password might not meet requirements
--   - Email might already exist

-- =====================================================
-- QUICK REFERENCE: Correct Order
-- =====================================================
-- 1. Create user in auth.users (via Dashboard, API, or app)
-- 2. Get the user ID (UUID)
-- 3. Create profile with that exact ID
-- 4. Verify with Step 6 query above
