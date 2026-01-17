-- =====================================================
-- Fix Infinite Recursion in RLS Policies
-- =====================================================
-- This script fixes the infinite recursion error
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;

-- Step 2: Create a helper function that bypasses RLS
-- This function checks if the current user is an admin
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

-- Step 3: Recreate the admin policy using the helper function
-- This avoids infinite recursion because the function uses SECURITY DEFINER
CREATE POLICY "Admins can do everything"
ON profiles FOR ALL
USING (is_admin());

-- =====================================================
-- Alternative: If you prefer separate policies for each operation
-- =====================================================
-- Uncomment below if you want more granular control:

/*
-- Drop the combined policy
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;

-- Admin SELECT policy
CREATE POLICY "Admins can select all profiles"
ON profiles FOR SELECT
USING (is_admin());

-- Admin INSERT policy
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (is_admin());

-- Admin UPDATE policy
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (is_admin());

-- Admin DELETE policy
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (is_admin());
*/

-- =====================================================
-- Verification
-- =====================================================
-- Test that the function works (should return true/false):
-- SELECT is_admin();

-- Check all policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
