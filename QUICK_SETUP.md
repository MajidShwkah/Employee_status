# Quick Setup Guide

Since you've already cleaned up the old tables, here's the quick setup:

---

## 🚀 Step 1: Create New Table Structure

Run this in Supabase SQL Editor:

**File: `create_new_profiles.sql`**

This creates:
- ✅ New `profiles` table
- ✅ RLS policies
- ✅ Indexes
- ✅ Triggers
- ✅ Realtime setup

---

## 👤 Step 2: Create First Admin User

### Option A: Hash Password Manually

1. **Hash your password** using SHA-256:
   - Online tool: https://emn178.github.io/online-tools/sha256.html
   - Or browser console (see `create_first_admin_user.sql`)

2. **Run the INSERT** from `create_first_admin_user.sql`:
   ```sql
   INSERT INTO profiles (username, password_hash, full_name, role, status)
   VALUES (
     'admin',
     'your_hashed_password_here',
     'Admin User',
     'admin',
     'free'
   );
   ```

### Option B: Use App (Easier!)

1. **Temporarily allow inserts** (already done by policy)
2. **Create a test user** via SQL with a simple hash
3. **Login to app** with that user
4. **Use admin panel** to create proper admin (app handles hashing)

---

## 📋 Quick Hash Example

If you want password `admin123`:

1. Go to: https://emn178.github.io/online-tools/sha256.html
2. Enter: `admin123`
3. Copy hash: `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
4. Use in INSERT statement

---

## ✅ Verification

After setup, verify:

```sql
-- Check table exists
SELECT * FROM profiles LIMIT 1;

-- Check admin exists
SELECT username, full_name, role FROM profiles WHERE role = 'admin';
```

---

## 🎯 What You Get

After running both scripts:
- ✅ New `profiles` table (no auth dependency)
- ✅ Username/password login
- ✅ No email required
- ✅ First admin user created
- ✅ Ready to use!

---

**Run `create_new_profiles.sql` first, then create your admin!** 🚀
