-- Test Realtime is working
-- Run this to verify realtime is properly configured

-- 1. Check if profiles is in realtime publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- Should return 1 row if realtime is enabled

-- 2. Check RLS policies (realtime needs SELECT permission)
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

-- Make sure there's a policy that allows SELECT for public/anonymous users
-- This is needed for realtime to work on the public dashboard

-- 3. Test update (this should trigger realtime)
-- Replace 'some-user-id' with an actual user ID from your profiles table
-- UPDATE profiles 
-- SET status = 'busy', updated_at = NOW() 
-- WHERE id = 'some-user-id';
