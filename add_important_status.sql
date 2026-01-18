-- Add 'important' status to profiles table
-- Run this in Supabase SQL Editor

-- Update the CHECK constraint to include 'important'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('free', 'busy', 'important'));

-- Verify the change
SELECT column_name, data_type, column_default, 
       (SELECT constraint_name FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' AND column_name = 'status' LIMIT 1) as constraint_name
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'status';
