-- =====================================================
-- Setup Supabase Storage for Avatar Uploads
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Note: Storage buckets are created via the Supabase Dashboard UI
-- This SQL script helps set up policies for the bucket

-- =====================================================
-- STEP 1: Create Storage Bucket (via Dashboard)
-- =====================================================
-- Go to: Supabase Dashboard → Storage → Create Bucket
-- Bucket name: "avatars"
-- Public: Yes (so images can be accessed via URL)
-- File size limit: 5MB (or your preference)
-- Allowed MIME types: image/*

-- =====================================================
-- STEP 2: Set Up Storage Policies (Run this SQL)
-- =====================================================

-- Policy 1: Anyone can view (read) avatars (public access)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- ALTERNATIVE: Simpler Policy (if above doesn't work)
-- =====================================================
-- If the folder-based policies don't work, use this simpler approach:

/*
-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);
*/

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if bucket exists:
-- SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. The bucket must be created via Dashboard first
-- 2. Set bucket to "Public" so images are accessible
-- 3. File paths will be: avatars/{user-id}-{random}.{ext}
-- 4. The app automatically generates unique filenames
-- 5. Old avatars are replaced (upsert: true) when uploading new one
-- =====================================================
