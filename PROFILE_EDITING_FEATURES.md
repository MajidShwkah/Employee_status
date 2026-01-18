# Profile Editing Features

Employees can now edit their profile, including avatar, name, and password!

---

## ✨ New Features Added

### 1. **Avatar Upload** 📸
- Upload custom profile pictures
- Preview before saving
- Automatic image validation (type, size)
- Replaces old avatar automatically

### 2. **Edit Name** ✏️
- Change full name anytime
- Updates immediately on dashboard

### 3. **Change Password** 🔒
- Secure password change
- Requires current password
- Validates new password strength

---

## 🎯 How to Use

### For Employees:

1. **Login to Employee Control Panel**
   - Go to http://localhost:5173/
   - Click "Settings"
   - Login with your credentials

2. **Click "Edit Profile" Button**
   - Top right of the control panel
   - Opens profile settings section

3. **Upload Avatar**
   - Click "Upload Image" button
   - Select an image file (JPG, PNG, etc.)
   - Max size: 5MB
   - Preview appears immediately
   - Click "Save Profile Changes" to upload

4. **Edit Name**
   - Type new name in "Full Name" field
   - Click "Save Profile Changes"

5. **Change Password**
   - Enter current password
   - Enter new password (min 6 characters)
   - Confirm new password
   - Click "Change Password"

---

## 📋 Setup Required

### ⚠️ Important: Set Up Storage First!

Before employees can upload avatars, you need to set up Supabase Storage:

1. **Create Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create bucket named: `avatars`
   - Set to **Public**
   - File size limit: 5MB

2. **Set Up Policies**
   - Run `setup_storage.sql` in SQL Editor
   - Or follow instructions in `STORAGE_SETUP.md`

See `STORAGE_SETUP.md` for detailed instructions.

---

## 🔧 Technical Details

### Avatar Upload Flow:
```
1. User selects image file
2. Client validates (type, size)
3. File uploaded to Supabase Storage
4. Public URL generated
5. URL saved to profiles.avatar_url
6. Avatar displayed everywhere
```

### File Storage:
- **Bucket**: `avatars`
- **Path format**: `avatars/{user-id}-{random}.{ext}`
- **Public access**: Yes (for direct image URLs)
- **Max size**: 5MB (validated client-side)

### Security:
- ✅ Users can only upload/update their own avatars
- ✅ Storage policies enforce access control
- ✅ File validation prevents malicious uploads
- ✅ Password change requires authentication

---

## 🎨 UI Features

### Profile Settings Panel:
- **Collapsible section** - Click "Edit Profile" to show/hide
- **Avatar preview** - See image before saving
- **Upload progress** - Shows "Uploading..." during upload
- **Form validation** - Prevents invalid inputs
- **Success messages** - Confirms when changes are saved

### Visual Indicators:
- ✅ Green "Save" button for profile changes
- 🔵 Blue "Change Password" button
- ⚙️ Settings icon on "Edit Profile" button
- 📤 Upload icon on file input

---

## 📝 What Employees Can Edit

| Feature | Editable | Notes |
|---------|----------|-------|
| **Avatar** | ✅ Yes | Upload custom image |
| **Full Name** | ✅ Yes | Change display name |
| **Password** | ✅ Yes | Secure password change |
| **Email** | ❌ No | Requires admin or separate process |
| **Role** | ❌ No | Only admins can change |
| **Status** | ✅ Yes | Via status controls (existing feature) |

---

## 🐛 Troubleshooting

### "Error uploading avatar"
- **Check**: Storage bucket exists and is public
- **Check**: Storage policies are set up
- **Check**: File is under 5MB
- **Check**: File is an image type

### "Password change fails"
- **Check**: Current password is correct
- **Check**: New password is at least 6 characters
- **Check**: New passwords match

### "Changes don't save"
- **Check**: You're logged in
- **Check**: RLS policies allow updates
- **Check**: Browser console for errors

### "Avatar doesn't appear"
- **Check**: Storage bucket is public
- **Check**: Avatar URL is saved in database
- **Check**: Image file is valid

---

## ✅ Testing Checklist

- [ ] Storage bucket `avatars` created
- [ ] Storage policies set up
- [ ] Employee can login
- [ ] "Edit Profile" button appears
- [ ] Can upload avatar image
- [ ] Avatar preview works
- [ ] Can change name
- [ ] Can change password
- [ ] Changes save successfully
- [ ] Avatar appears on public dashboard
- [ ] Name updates everywhere

---

## 🚀 Next Steps

1. **Set up Storage** (if not done)
   - Follow `STORAGE_SETUP.md`

2. **Test the features**
   - Login as employee
   - Try uploading avatar
   - Try changing name
   - Try changing password

3. **Verify on dashboard**
   - Check public dashboard
   - Verify avatar appears
   - Verify name is updated

---

## 📚 Related Files

- `src/App.jsx` - Main app with profile editing code
- `setup_storage.sql` - Storage policies SQL
- `STORAGE_SETUP.md` - Storage setup guide
- `supabase_setup.sql` - Database setup (already run)

---

**All profile editing features are now live!** 🎉

Employees have full control over their profile information.
