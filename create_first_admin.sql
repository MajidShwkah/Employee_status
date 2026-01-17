-- =====================================================
-- Create First Admin User - SQL Method
-- =====================================================
-- This script helps you create your first admin user
-- Run this in Supabase SQL Editor
-- =====================================================

-- Method 1: Using Supabase's auth.users table directly
-- Note: This requires using the Supabase Management API or Dashboard
-- The auth.users table is managed by Supabase Auth system

-- =====================================================
-- OPTION A: Create User via Supabase Dashboard (if available)
-- =====================================================
-- 1. Go to Authentication → Users
-- 2. Look for "Invite User" or "Add User" button
-- 3. If not visible, try the "..." menu or check if you need to enable it in settings
-- 4. Enter email and password
-- 5. Make sure "Auto Confirm" is checked (or disable email confirmation in settings)

-- =====================================================
-- OPTION B: Use Supabase Management API (Recommended)
-- =====================================================
-- You can create a user using curl or a script:

/*
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securePassword123",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Admin User"
    }
  }'
*/

-- =====================================================
-- OPTION C: Create Profile After User Exists
-- =====================================================
-- If you already created a user (via signup, dashboard, or API),
-- you can create their profile with this SQL:

-- Step 1: Find the user ID from auth.users
-- Run this to see all users and their IDs:
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Insert the profile (replace 'USER_ID_HERE' with actual UUID)
-- Uncomment and modify the INSERT below:

/*
INSERT INTO profiles (id, full_name, role, status, avatar_url)
VALUES (
  'USER_ID_HERE',  -- Replace with UUID from Step 1
  'Admin User',    -- Change to actual name
  'admin',         -- Set as admin
  'free',
  'https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff&size=128'
);
*/

-- =====================================================
-- OPTION D: Temporary Signup Method
-- =====================================================
-- If you can't find "Add User" in dashboard:
-- 1. Temporarily enable public signups in Auth Settings
-- 2. Use your app's signup/login page to create a test account
-- 3. Then update that user's role to 'admin' using SQL:

/*
-- First, find the user you just created:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update their profile to admin:
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_ID_FROM_ABOVE';
*/

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After creating the profile, verify it exists:
SELECT p.id, p.full_name, p.role, p.status, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
