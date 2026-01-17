# Database Structure - Employee Status Dashboard

## Table: `profiles`

This is the main table that stores employee information and their current status.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID (matches Supabase Auth user ID) |
| `full_name` | TEXT | NOT NULL | Employee's full name |
| `avatar_url` | TEXT | NULLABLE | URL to employee's avatar image |
| `role` | TEXT | CHECK (role IN ('admin', 'employee')), DEFAULT 'employee' | User role: admin or employee |
| `status` | TEXT | CHECK (status IN ('free', 'busy')), DEFAULT 'free' | Current status: free or busy |
| `status_note` | TEXT | NULLABLE | Optional note explaining current status |
| `busy_until` | TIMESTAMP WITH TIME ZONE | NULLABLE | When the busy status expires (null if free) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

### Relationships

- **One-to-One with `auth.users`**: Each profile is linked to exactly one Supabase Auth user via the `id` field
- **Cascade Delete**: If a user is deleted from `auth.users`, their profile is automatically deleted

---

## Row Level Security (RLS) Policies

### 1. Public Read Access
- **Policy Name**: "Public profiles are viewable by everyone"
- **Operation**: SELECT
- **Access**: Everyone (including unauthenticated users)
- **Purpose**: Allows the public dashboard to display all employees

### 2. Self Update
- **Policy Name**: "Users can update own profile"
- **Operation**: UPDATE
- **Access**: Users can only update their own profile
- **Purpose**: Allows employees to update their own status

### 3. Admin Full Access
- **Policy Name**: "Admins can do everything"
- **Operation**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Access**: Only users with role = 'admin'
- **Purpose**: Allows admins to manage all employees

### 4. Self Insert
- **Policy Name**: "Users can insert own profile"
- **Operation**: INSERT
- **Access**: Users can only insert their own profile
- **Purpose**: Needed when creating new users via admin panel

---

## Realtime

The `profiles` table is enabled for Supabase Realtime, which means:
- Changes to the table are broadcast to all connected clients
- No polling needed - updates appear instantly
- Supports INSERT, UPDATE, and DELETE events

---

## How the App Uses the Database

### Public Dashboard
- **Query**: `SELECT * FROM profiles ORDER BY full_name`
- **Access**: Public (no authentication required)
- **Purpose**: Display all employees and their status

### Employee Login
- **Query**: `SELECT * FROM profiles WHERE id = auth.uid()`
- **Access**: Authenticated users only
- **Purpose**: Get current user's profile after login

### Update Status (Employee)
- **Query**: `UPDATE profiles SET status = ?, status_note = ?, busy_until = ?, updated_at = NOW() WHERE id = auth.uid()`
- **Access**: Users can only update their own profile
- **Purpose**: Employee sets themselves as free/busy

### Admin Operations
- **Add Employee**: 
  1. Create user in `auth.users` via `supabase.auth.signUp()`
  2. Insert profile: `INSERT INTO profiles (id, full_name, role, status, avatar_url) VALUES (...)`
- **Update Employee**: `UPDATE profiles SET full_name = ?, role = ? WHERE id = ?`
- **Delete Employee**: `DELETE FROM profiles WHERE id = ?` (cascade deletes auth user)

---

## Setup Instructions

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase_setup.sql`
4. Click **Run** to execute all queries
5. Verify setup by checking:
   - Table exists: `SELECT * FROM profiles LIMIT 1;`
   - RLS is enabled: Check in Table Editor → RLS policies
   - Realtime is enabled: Check in Database → Replication

---

## Example Data

After setup, you can manually insert a test admin user:

```sql
-- First, create the auth user (this is usually done via the app)
-- Then insert the profile:
INSERT INTO profiles (id, full_name, role, status, avatar_url)
VALUES (
  'your-user-id-here',  -- Get this from auth.users after creating user
  'Admin User',
  'admin',
  'free',
  'https://ui-avatars.com/api/?name=Admin+User&background=4F46E5&color=fff&size=128'
);
```

**Note**: In practice, users are created through the app's admin panel, which handles both auth user creation and profile insertion automatically.
