# Setting Up Supabase Storage for Avatar Uploads

To enable avatar uploads in your app, you need to set up a Supabase Storage bucket.

---

## 📋 Step-by-Step Setup

### Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to **Storage** (left sidebar)

2. **Create New Bucket**
   - Click **"New bucket"** or **"Create bucket"**
   - **Bucket name**: `avatars`
   - **Public bucket**: ✅ **Yes** (check this - required for public image URLs)
   - **File size limit**: `5` MB (or your preference)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
   - Click **"Create bucket"**

### Step 2: Set Up Storage Policies

1. **Go to SQL Editor**
   - In Supabase Dashboard, click **SQL Editor**

2. **Run the Storage Policies SQL**
   - Open `setup_storage.sql` from your project
   - Copy and paste into SQL Editor
   - Click **"Run"**

   This creates policies that allow:
   - ✅ Public read access (anyone can view avatars)
   - ✅ Authenticated users can upload their own avatars
   - ✅ Users can update/delete their own avatars

### Step 3: Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

---

## 🔧 Alternative: Manual Policy Setup

If the SQL script doesn't work, you can set up policies manually:

1. **Go to Storage → Policies**
   - Click on the `avatars` bucket
   - Click **"New Policy"**

2. **Create Policies:**

   **Policy 1: Public Read**
   - Policy name: "Public avatar access"
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - USING expression: `bucket_id = 'avatars'`

   **Policy 2: Authenticated Upload**
   - Policy name: "Users can upload avatars"
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - WITH CHECK expression: `bucket_id = 'avatars'`

   **Policy 3: Authenticated Update**
   - Policy name: "Users can update avatars"
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'avatars'`

   **Policy 4: Authenticated Delete**
   - Policy name: "Users can delete avatars"
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'avatars'`

---

## ✅ What This Enables

After setup, employees can:
- ✅ Upload their own profile pictures
- ✅ Update their avatar anytime
- ✅ Delete old avatars (replaced automatically)
- ✅ See their avatar on the public dashboard

---

## 🎯 How It Works

1. **User uploads image** → App validates (type, size)
2. **Image uploaded to Storage** → Path: `avatars/{user-id}-{random}.{ext}`
3. **Public URL generated** → Stored in `profiles.avatar_url`
4. **Avatar displayed** → On dashboard and employee panel

---

## ⚠️ Important Notes

### Bucket Must Be Public
- The `avatars` bucket **must be public** for images to be accessible
- Private buckets require signed URLs (more complex)

### File Size Limits
- Default limit is usually 50MB
- Recommended: 5MB for avatars
- App validates 5MB client-side

### File Types
- App accepts: `image/*` (all image types)
- Recommended: JPG, PNG, WebP
- Validated client-side before upload

### Security
- Users can only upload/update their own avatars
- Policies prevent unauthorized access
- File names include user ID for security

---

## 🐛 Troubleshooting

### "Bucket not found"
- Make sure you created the bucket named `avatars`
- Check spelling (case-sensitive)

### "Permission denied"
- Check that policies are created correctly
- Verify bucket is set to "Public"
- Check RLS is enabled on storage.objects

### "Upload fails"
- Check file size (must be < 5MB)
- Verify file is an image type
- Check browser console for errors

### "Image doesn't display"
- Verify bucket is public
- Check the avatar_url in profiles table
- Verify the URL is accessible

---

## 📝 Quick Checklist

- [ ] Created `avatars` bucket in Storage
- [ ] Set bucket to **Public**
- [ ] Set file size limit (5MB recommended)
- [ ] Ran `setup_storage.sql` to create policies
- [ ] Verified policies exist
- [ ] Tested avatar upload in app

---

Once setup is complete, employees can click **"Edit Profile"** in their control panel to upload avatars! 🎉
