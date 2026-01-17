# Cleanup Guide - Removing Old Tables

## 🗑️ What You Need to Remove

1. **Old `profiles` table** - Has foreign key to auth.users
2. **Old policies** - Related to auth system
3. **Old functions** - Auth-related helpers
4. **auth.users table** - Cannot be dropped (Supabase managed)

---

## 📋 Option 1: Cleanup Only (Recommended)

Use `cleanup_old_tables.sql` to remove old structure:

```sql
-- Run this in Supabase SQL Editor
-- This removes old profiles table and related objects
```

**What it does:**
- ✅ Drops old `profiles` table
- ✅ Removes all old policies
- ✅ Drops helper functions
- ✅ Removes from realtime
- ✅ Drops old indexes

**What it doesn't do:**
- ❌ Cannot drop `auth.users` (Supabase managed)

---

## 📋 Option 2: Complete Cleanup + Fresh Start

Use `complete_cleanup.sql` for everything in one go:

```sql
-- Run this in Supabase SQL Editor
-- This removes old structure AND creates new one
```

**What it does:**
- ✅ Drops old `profiles` table
- ✅ Removes all old policies/functions
- ✅ Creates NEW simplified `profiles` table
- ✅ Sets up new policies
- ✅ Creates indexes
- ✅ Sets up triggers

**One script does it all!**

---

## ⚠️ About auth.users Table

### Why You Can't Drop It:
- `auth.users` is managed by Supabase Auth system
- It's in the `auth` schema (not `public`)
- Cannot be dropped via SQL
- Protected by Supabase

### What to Do:
1. **Option A: Leave it** (Recommended)
   - It won't interfere with your new system
   - Just ignore it
   - Your new system doesn't use it

2. **Option B: Delete Users Manually**
   - Go to Supabase Dashboard
   - Authentication → Users
   - Delete users one by one
   - Table structure remains but empty

3. **Option C: Use Management API**
   - Use service role key
   - Delete users programmatically
   - More complex

**Recommendation**: Just leave it - it won't cause any issues!

---

## 🚀 Quick Start

### Step 1: Run Cleanup
```sql
-- Option A: Cleanup only
-- Run: cleanup_old_tables.sql

-- Option B: Cleanup + Fresh start
-- Run: complete_cleanup.sql (recommended)
```

### Step 2: Verify
```sql
-- Check old table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';
-- Should return nothing (if cleanup only) or new structure (if complete)

-- Check new table exists (if using complete_cleanup.sql)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

### Step 3: Create First Admin
- Use the app's admin panel, or
- Insert via SQL (hash password first)

---

## 📝 SQL Queries Summary

### Drop Old Profiles Table:
```sql
DROP TABLE IF EXISTS profiles CASCADE;
```

### Drop All Policies:
```sql
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
```

### Drop Functions:
```sql
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Remove from Realtime:
```sql
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS profiles;
```

### Drop Indexes:
```sql
DROP INDEX IF EXISTS profiles_role_idx;
DROP INDEX IF EXISTS profiles_status_idx;
DROP INDEX IF EXISTS profiles_updated_at_idx;
DROP INDEX IF EXISTS profiles_username_idx;
```

---

## ✅ After Cleanup

1. ✅ Old structure removed
2. ✅ Ready for new simplified system
3. ✅ Run `simple_profiles_setup.sql` (if using cleanup only)
4. ✅ Or already done (if using complete_cleanup.sql)
5. ✅ Create first admin user
6. ✅ Start using simplified system!

---

## 🎯 Recommended Approach

**Use `complete_cleanup.sql`** - It does everything in one go:
- Removes old structure
- Creates new structure
- Sets up policies
- Ready to use!

---

## ⚠️ Warnings

- ⚠️ **DELETES ALL DATA** in profiles table
- ⚠️ Make backups if you need old data
- ⚠️ Cannot undo after running
- ⚠️ auth.users cannot be dropped (but won't interfere)

---

**Choose your approach and run the appropriate SQL script!** 🚀
