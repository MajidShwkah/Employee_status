# Fix: Foreign Key Constraint Error

## Error Explanation

The error `"insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\"` means:

- You're trying to create a profile with an `id` that doesn't exist in `auth.users`
- The `profiles.id` column has a foreign key constraint: `REFERENCES auth.users(id)`
- **You MUST create the user in `auth.users` FIRST, then create the profile**

---

## ✅ Correct Way to Create Users

### Method 1: Using Your App (Recommended)

Your app already handles this correctly! The `addEmployee` function:

1. **First** creates the auth user → gets the auto-generated UUID
2. **Then** creates the profile using that UUID

```javascript
// Step 1: Create auth user (Supabase generates UUID)
const { data: authData } = await supabase.auth.signUp({
  email: newEmployee.email,
  password: newEmployee.password
});

// Step 2: Use that UUID for the profile
await supabase.from('profiles').insert({
  id: authData.user.id,  // ← This ID comes from auth.users
  full_name: newEmployee.full_name,
  // ...
});
```

**This is the correct order!** ✅

---

### Method 2: Using Supabase Management API

If creating users programmatically:

```bash
# Step 1: Create auth user via API
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "email_confirm": true
  }'

# Response will include: {"id": "uuid-here", ...}

# Step 2: Use that UUID to create profile
# Run in SQL Editor:
INSERT INTO profiles (id, full_name, role, status)
VALUES (
  'uuid-from-step-1',  -- Must match the ID from auth.users
  'User Name',
  'employee',
  'free'
);
```

---

### Method 3: Check Existing Users First

If you're trying to create a profile manually:

**Step 1: Find existing users**
```sql
-- See all users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

**Step 2: Use one of those IDs**
```sql
-- Only use IDs that exist in the query above
INSERT INTO profiles (id, full_name, role, status)
VALUES (
  'EXISTING_USER_ID_FROM_ABOVE',  -- Must exist in auth.users
  'User Name',
  'employee',
  'free'
);
```

---

## ❌ Common Mistakes

### Mistake 1: Creating Profile Before User
```sql
-- ❌ WRONG: This will fail if the ID doesn't exist
INSERT INTO profiles (id, full_name, role)
VALUES ('some-random-uuid', 'John Doe', 'employee');
```

**Fix:** Create the user in `auth.users` first, then use that ID.

### Mistake 2: Using Wrong ID Format
```sql
-- ❌ WRONG: Not a valid UUID
INSERT INTO profiles (id, full_name) VALUES ('123', 'John');
```

**Fix:** UUIDs must be in format: `'550e8400-e29b-41d4-a716-446655440000'`

### Mistake 3: Copying ID Incorrectly
```sql
-- ❌ WRONG: Typo in UUID
INSERT INTO profiles (id, full_name) 
VALUES ('550e8400-e29b-41d4-a716-44665544000', 'John');  -- Missing digit
```

**Fix:** Double-check the UUID matches exactly from `auth.users`.

---

## 🔍 Troubleshooting Steps

### Step 1: Verify User Exists
```sql
-- Check if the user ID exists
SELECT id, email 
FROM auth.users 
WHERE id = 'YOUR_USER_ID_HERE';
```

If this returns nothing, the user doesn't exist yet.

### Step 2: Create User First
Use one of these methods:
- **Supabase Dashboard** → Authentication → Users → Add User
- **Your app's admin panel** (if you have an admin account)
- **Management API** (using service role key)
- **Node.js script** (`create_admin_user.js`)

### Step 3: Then Create Profile
```sql
-- Only after user exists in auth.users
INSERT INTO profiles (id, full_name, role, status)
VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'User Name',
  'employee',
  'free'
);
```

---

## 🚀 Quick Fix Script

If you need to create your first admin user, use the script I created:

1. **Edit `create_admin_user.js`**:
   - Add your `SERVICE_ROLE_KEY`
   - Update email, password, name

2. **Run it**:
   ```bash
   node create_admin_user.js
   ```

This script creates both the auth user AND the profile in the correct order.

---

## 📋 Complete Example: Creating First Admin

```sql
-- Step 1: Create user via Supabase Dashboard or API
-- (Get the user ID from the response)

-- Step 2: Verify user exists
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Step 3: Create profile with that ID
INSERT INTO profiles (id, full_name, role, status, avatar_url)
VALUES (
  'USER_ID_FROM_STEP_1',  -- Must match exactly
  'Admin User',
  'admin',
  'free',
  'https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff&size=128'
);

-- Step 4: Verify it worked
SELECT p.*, u.email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

---

## 💡 Key Takeaway

**Always create the user in `auth.users` FIRST, then create the profile.**

The foreign key constraint ensures data integrity - every profile must have a corresponding auth user.
