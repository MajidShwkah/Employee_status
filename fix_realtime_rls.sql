-- Fix RLS policies for Realtime to work on public dashboard
-- Realtime needs SELECT permission for anonymous users

-- Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Policy 1: Public can view all profiles (needed for public dashboard and realtime)
-- This allows anyone (including anonymous users) to SELECT from profiles
-- This is safe because we're only showing status information, not sensitive data
CREATE POLICY "Public can view all profiles"
ON profiles FOR SELECT
USING (true);

-- If you get an error that the policy already exists, that's fine!
-- The policy might already be there with a different name.

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'SELECT';

-- You should see at least one SELECT policy that allows public access
