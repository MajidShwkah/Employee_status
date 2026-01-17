# Simple Profiles Table Structure

## 📋 New Table Schema

The simplified `profiles` table structure (no authentication required):

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Auto-generated unique ID |
| `username` | TEXT | UNIQUE, NOT NULL | Login username (unique) |
| `password_hash` | TEXT | NOT NULL | Hashed password |
| `full_name` | TEXT | NOT NULL | Display name |
| `avatar_url` | TEXT | NULLABLE | Profile picture URL |
| `role` | TEXT | CHECK (role IN ('admin', 'employee')), DEFAULT 'employee' | User role |
| `status` | TEXT | CHECK (status IN ('free', 'busy')), DEFAULT 'free' | Current status |
| `status_note` | TEXT | NULLABLE | Status message |
| `busy_until` | TIMESTAMP WITH TIME ZONE | NULLABLE | When busy status expires |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation time |

---

## 🔑 Key Changes

### Removed:
- ❌ Foreign key to `auth.users`
- ❌ Email field
- ❌ Email confirmation
- ❌ Supabase Auth dependency

### Added:
- ✅ `username` - for login
- ✅ `password_hash` - for password storage
- ✅ `created_at` - timestamp

---

## 🔐 Authentication Flow

### Login:
1. User enters **username** and **password**
2. App queries `profiles` table by `username`
3. App compares password hash
4. If match → login successful
5. Store user session in app state

### No Email Needed:
- ✅ Simple username/password login
- ✅ No email confirmation
- ✅ No email field in database
- ✅ Faster, simpler system

---

## 📝 Example Data

```sql
-- Example employee
INSERT INTO profiles (username, password_hash, full_name, role, status)
VALUES (
  'johndoe',
  '$2b$10$hashedpasswordhere',  -- Use bcrypt or similar
  'John Doe',
  'employee',
  'free'
);

-- Example admin
INSERT INTO profiles (username, password_hash, full_name, role, status)
VALUES (
  'admin',
  '$2b$10$hashedpasswordhere',
  'Admin User',
  'admin',
  'free'
);
```

---

## 🚀 Setup Steps

1. **Run the SQL script** (`simple_profiles_setup.sql`)
2. **Update the app code** (removing auth dependencies)
3. **Create first admin user** manually or via app
4. **Test login** with username/password

---

## 🔒 Password Hashing

**Important**: Passwords must be hashed before storing!

### Options:
1. **bcrypt** (recommended) - JavaScript library
2. **Simple hash** - Less secure, but simpler
3. **Supabase Edge Function** - Server-side hashing

For simplicity, we can use a basic approach in the app, but bcrypt is recommended for production.

---

## ✅ Benefits

- ✅ **Simpler** - No auth system complexity
- ✅ **Faster** - Direct database queries
- ✅ **No email** - No email confirmation needed
- ✅ **Independent** - Not tied to Supabase Auth
- ✅ **Flexible** - Easy to customize

---

## ⚠️ Security Notes

- Passwords must be hashed (never store plain text)
- Use HTTPS in production
- Consider rate limiting for login attempts
- Store session securely (localStorage/sessionStorage)

---

This is a much simpler system! 🎉
