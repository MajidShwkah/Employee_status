# How to Create New Users

There are **two main ways** to create new users in the Employee Status Dashboard:

---

## Method 1: Using the Admin Panel (Recommended) ✨

This is the easiest and recommended way to create users through the web interface.

### Steps:

1. **Login as Admin**
   - Go to the login page
   - Sign in with an admin account

2. **Access Admin Panel**
   - You'll automatically be redirected to the Admin Panel after login
   - Or click "View Dashboard" → "Admin Panel" if you're already logged in

3. **Click "Add Employee" Button**
   - You'll see a green "Add Employee" button in the top right of the employee list

4. **Fill in the Form**
   - **Full Name**: Employee's full name (e.g., "John Doe")
   - **Email**: Employee's email address (must be unique)
   - **Password**: Choose a secure password for the employee
   - **Role**: Select either "Employee" or "Admin"

5. **Click "Add Employee"**
   - The system will:
     - Create a user account in Supabase Auth
     - Create a profile in the `profiles` table
     - Generate an avatar automatically
     - Set default status to "free"

### What Happens Behind the Scenes:

```javascript
// Step 1: Create auth user (Supabase generates UUID automatically)
const { data: authData } = await supabase.auth.signUp({
  email: newEmployee.email,
  password: newEmployee.password
});

// Step 2: Create profile with the generated user ID
await supabase.from('profiles').insert({
  id: authData.user.id,           // Auto-generated UUID from auth
  full_name: newEmployee.full_name,
  role: newEmployee.role,
  status: 'free',
  avatar_url: 'https://ui-avatars.com/api/?name=...' // Auto-generated
});
```

---

## Method 2: Manual Creation via Supabase Dashboard

If you need to create a user manually or programmatically, you can do it directly in Supabase.

### Option A: Using Supabase Auth Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to **Authentication** → **Users**

2. **Click "Add User"**
   - Enter email and password
   - Click "Create User"
   - Supabase will generate a UUID for the user

3. **Create Profile Manually**
   - Go to **Table Editor** → **profiles**
   - Click "Insert Row"
   - Enter:
     - `id`: Copy the UUID from the user you just created
     - `full_name`: Employee's name
     - `role`: 'employee' or 'admin'
     - `status`: 'free' (default)
     - `avatar_url`: (optional) or leave blank for auto-generation

### Option B: Using SQL

Run this SQL in the Supabase SQL Editor:

```sql
-- Step 1: Create auth user (Supabase will auto-generate UUID)
-- Note: This requires using Supabase Auth API or Dashboard
-- The SQL below assumes you already have the user ID

-- Step 2: Insert profile (replace 'USER_UUID_HERE' with actual UUID)
INSERT INTO profiles (id, full_name, role, status, avatar_url)
VALUES (
  'USER_UUID_HERE',  -- Get this from auth.users table
  'John Doe',
  'employee',        -- or 'admin'
  'free',
  'https://ui-avatars.com/api/?name=John+Doe&background=4F46E5&color=fff&size=128'
);
```

**To get the user UUID:**
```sql
-- View all auth users and their IDs
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

---

## Method 3: Programmatic Creation (API/Script)

You can also create users programmatically using the Supabase client:

```javascript
// Using JavaScript/Node.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createUser(fullName, email, password, role = 'employee') {
  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  // Step 2: Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: fullName,
      role: role,
      status: 'free',
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=128`
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('User created successfully!');
  }
}

// Usage
createUser('Jane Smith', 'jane@example.com', 'securePassword123', 'employee');
```

---

## Important Notes

### Email Confirmation

By default, Supabase requires email confirmation for new users. You have two options:

1. **Disable Email Confirmation** (for development):
   - Go to Supabase Dashboard → **Authentication** → **Settings**
   - Under "Email Auth", disable "Enable email confirmations"

2. **Keep Email Confirmation** (for production):
   - Users will receive a confirmation email
   - They must click the link to activate their account
   - Until confirmed, they cannot log in

### Creating the First Admin User

Since you need admin access to create users through the app, you'll need to create the first admin manually:

1. **Create user via Supabase Dashboard** (Authentication → Users)
2. **Create profile with role='admin'**:
   ```sql
   INSERT INTO profiles (id, full_name, role, status)
   VALUES (
     'YOUR_USER_UUID',
     'Admin Name',
     'admin',
     'free'
   );
   ```
3. **Login with that account** to access the admin panel

### Password Requirements

Supabase has default password requirements:
- Minimum 6 characters (configurable)
- Can be changed in Authentication → Settings → Password

---

## Troubleshooting

### "User already exists"
- The email is already registered
- Use a different email or reset the password

### "Profile creation fails"
- Make sure the user ID exists in `auth.users`
- Check RLS policies allow the insert
- Verify the ID matches exactly

### "Can't login after creation"
- Check if email confirmation is required
- Verify the password is correct
- Check Supabase Auth logs for errors

---

## Quick Reference

| Method | Best For | Difficulty |
|--------|----------|------------|
| Admin Panel | Regular use, non-technical users | ⭐ Easy |
| Supabase Dashboard | First admin, manual setup | ⭐⭐ Medium |
| SQL | Bulk imports, automation | ⭐⭐⭐ Advanced |
| API/Script | Integration, automation | ⭐⭐⭐ Advanced |
