# How to Add New Employees

You have **two options** to add new employees. The **Admin Panel** method is recommended.

---

## ✅ Method 1: Using Admin Panel (Recommended) ⭐

This is the **easiest and recommended** way - your app handles everything automatically!

### Steps:

1. **Login as Admin**
   - Go to your app: http://localhost:5173/
   - Click "Staff Login"
   - Login with your admin account

2. **Access Admin Panel**
   - After login, you'll automatically see the **Admin Panel**
   - If you see the public dashboard, you're logged in as admin - the admin panel should be visible

3. **Click "Add Employee" Button**
   - In the Admin Panel, you'll see a green **"Add Employee"** button in the top right
   - Click it to open the form

4. **Fill in the Form**
   - **Full Name**: Employee's full name (e.g., "John Doe")
   - **Email**: Employee's email address (must be unique, not already registered)
   - **Password**: Choose a secure password for the employee
   - **Role**: Select either:
     - **Employee** - Regular employee who can update their status
     - **Admin** - Can manage other employees

5. **Click "Add Employee"**
   - The app will automatically:
     - ✅ Create the user account in Supabase Auth
     - ✅ Create the profile in the database
     - ✅ Generate an avatar automatically
     - ✅ Set default status to "free"
   - The new employee will appear in the list immediately

### What Happens Behind the Scenes:
```
1. Creates user in auth.users (Supabase generates UUID)
2. Creates profile with that UUID
3. Sets default values (status: 'free', role: 'employee')
4. Generates avatar URL
```

### ✅ Advantages:
- ✅ Simple and user-friendly
- ✅ Handles everything automatically
- ✅ No need to know SQL or Supabase details
- ✅ Creates both auth user and profile correctly
- ✅ Real-time updates - appears instantly

---

## 🔧 Method 2: Manual via Supabase (Advanced)

If you prefer to add employees directly in Supabase, you can do it manually:

### Steps:

1. **Create User in Supabase Auth**
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Click **"Add User"** or **"Invite User"**
   - Enter:
     - Email
     - Password
     - Make sure "Auto Confirm" is checked (or disable email confirmation in settings)
   - Click "Create User"
   - **Copy the User ID** (UUID) from the response

2. **Create Profile in Database**
   - Go to Supabase Dashboard → **Table Editor** → **profiles**
   - Click **"Insert Row"** or use SQL Editor
   - Enter:
     - `id`: Paste the User ID from Step 1 (must match exactly!)
     - `full_name`: Employee's name
     - `role`: 'employee' or 'admin'
     - `status`: 'free' (default)
     - `avatar_url`: (optional) Leave blank for auto-generation

3. **Verify**
   - Check that the employee appears in your app
   - They should be able to login with the email/password you set

### ⚠️ Important Notes:
- The `id` in profiles **must match** the user ID from `auth.users`
- If the IDs don't match, you'll get a foreign key error
- This method requires two steps (create user, then create profile)

---

## 📋 Comparison

| Method | Difficulty | Speed | Error Risk | Recommended For |
|--------|-----------|-------|------------|-----------------|
| **Admin Panel** | ⭐ Easy | Fast | Low | Regular use, non-technical users |
| **Supabase Manual** | ⭐⭐⭐ Advanced | Slower | Higher | Bulk imports, technical users |

---

## 🎯 Quick Guide: Admin Panel Method

```
1. Login as Admin
   ↓
2. See Admin Panel
   ↓
3. Click "Add Employee" (green button)
   ↓
4. Fill form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123"
   - Role: "Employee"
   ↓
5. Click "Add Employee"
   ↓
✅ Done! Employee can now login
```

---

## ❓ Troubleshooting

### "I don't see the Admin Panel"
- Make sure you logged in with an **admin** account (role = 'admin')
- Check your user's role in the database
- Try logging out and back in

### "Error creating user"
- **Email already exists**: Use a different email
- **Password too weak**: Use a stronger password (6+ characters)
- **Email confirmation required**: Disable it in Auth Settings, or check email

### "User created but can't login"
- Check if email confirmation is required
- Verify the password is correct
- Check Supabase Auth logs for errors

### "Employee doesn't appear in list"
- Refresh the page
- Check if profile was created (Table Editor → profiles)
- Verify the user exists in auth.users

---

## 💡 Tips

### Best Practices:
- ✅ Use the Admin Panel for regular employee additions
- ✅ Set strong passwords for employees
- ✅ Use unique email addresses
- ✅ Choose appropriate roles (most should be "employee")
- ✅ Employees can change their own passwords later (if enabled)

### Bulk Adding:
- For adding many employees at once, consider:
  - Using the Management API with a script
  - Or adding them one by one through the Admin Panel

---

## 🚀 Quick Start

**Easiest way:**
1. Login as admin
2. Click "Add Employee"
3. Fill the form
4. Done!

**No need to go to Supabase** - the app handles everything! 🎉

---

## 📝 What Information is Needed?

When adding an employee, you need:
- ✅ **Full Name** - Display name
- ✅ **Email** - For login (must be unique)
- ✅ **Password** - For login
- ✅ **Role** - 'employee' or 'admin'

**Optional/Auto-generated:**
- Avatar (auto-generated from name)
- Status (defaults to 'free')
- Status note (empty by default)

---

**Recommendation: Use the Admin Panel method - it's designed to be simple and handles all the complexity for you!** ✨
