# Simplified Dashboard System

## ✅ What Changed

The system has been **completely simplified** - no more Supabase Auth, no email, no confirmation!

---

## 📋 New Table Structure

### `profiles` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Auto-generated unique ID |
| `username` | TEXT (UNIQUE) | Login username |
| `password_hash` | TEXT | SHA-256 hashed password |
| `full_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture URL |
| `role` | TEXT | 'admin' or 'employee' |
| `status` | TEXT | 'free' or 'busy' |
| `status_note` | TEXT | Status message |
| `busy_until` | TIMESTAMP | When busy expires |
| `updated_at` | TIMESTAMP | Last update |
| `created_at` | TIMESTAMP | Creation time |

---

## 🔐 Authentication

### Login:
- **Username** + **Password** (no email!)
- Passwords hashed with SHA-256
- Session stored in `localStorage`

### No More:
- ❌ Supabase Auth
- ❌ Email addresses
- ❌ Email confirmation
- ❌ Foreign keys to auth.users

---

## 🚀 Setup Steps

### 1. Run SQL Script
```sql
-- Run simple_profiles_setup.sql in Supabase SQL Editor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create First Admin
```sql
-- Insert admin manually (password will be hashed)
-- Or use the app's admin panel after creating first user via SQL
```

### 4. Start App
```bash
npm run dev
```

---

## 📝 Creating Users

### Via Admin Panel:
1. Login as admin
2. Click "Add Employee"
3. Enter:
   - **Username** (unique)
   - **Full Name**
   - **Password** (min 6 chars)
   - **Role** (employee/admin)
4. Click "Add Employee"
5. ✅ User can login immediately!

### Via SQL:
```sql
-- Hash password first (use SHA-256)
-- Or use the app to create users (it handles hashing)

INSERT INTO profiles (username, password_hash, full_name, role, status)
VALUES (
  'johndoe',
  'hashed_password_here',  -- SHA-256 hash
  'John Doe',
  'employee',
  'free'
);
```

---

## 🔒 Password Hashing

- **Algorithm**: SHA-256 (Web Crypto API)
- **Client-side**: Passwords hashed before sending to database
- **Storage**: Only hashes stored, never plain text
- **Verification**: Hash comparison on login

**Note**: For production, consider using bcrypt or Argon2 for better security.

---

## ✅ Benefits

- ✅ **Simpler** - No auth system complexity
- ✅ **Faster** - Direct database queries
- ✅ **No email** - No email confirmation needed
- ✅ **Independent** - Not tied to Supabase Auth
- ✅ **Flexible** - Easy to customize
- ✅ **Instant login** - No confirmation delays

---

## 🎯 Login Flow

1. User enters **username** and **password**
2. App queries `profiles` table by `username`
3. App hashes entered password
4. Compares hash with stored `password_hash`
5. If match → Login successful
6. Store user ID in `localStorage`
7. Redirect to appropriate panel (admin/employee)

---

## 📱 User Experience

### For Employees:
- Login with username/password
- Edit profile (name, avatar, password)
- Update status (free/busy)
- No email needed!

### For Admins:
- Login with username/password
- Manage employees
- Add new employees (username + password)
- No email confirmation!

---

## 🔧 Technical Details

### Password Hashing:
```javascript
// Uses Web Crypto API (built into browsers)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // Convert to hex string
  return hashHex;
};
```

### Session Management:
- Stored in `localStorage` as `currentUserId`
- Persists across page refreshes
- Cleared on logout

### Database:
- Direct queries to `profiles` table
- No foreign keys
- Simple structure

---

## ⚠️ Security Notes

- Passwords are hashed (SHA-256)
- Use HTTPS in production
- Consider rate limiting for login
- For production, consider stronger hashing (bcrypt/Argon2)
- Session stored client-side (localStorage)

---

## 📚 Files Updated

- ✅ `src/App.jsx` - Complete rewrite (no auth)
- ✅ `simple_profiles_setup.sql` - New table structure
- ✅ `package.json` - Removed bcryptjs (using Web Crypto)

---

## 🎉 Result

**Much simpler system!**
- No authentication complexity
- No email requirements
- Direct database access
- Instant user creation
- Easy to understand and maintain

---

**The dashboard is now completely simplified!** 🚀
