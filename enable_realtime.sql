-- Enable Realtime for profiles table
-- Run this in Supabase SQL Editor if realtime updates aren't working

-- Check if realtime is already enabled
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- If the above returns no rows, enable realtime:
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Verify it's enabled (should return 1 row)
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'profiles';

-- If you get an error that the table is already in the publication, that's fine!
-- It means realtime is already enabled.
