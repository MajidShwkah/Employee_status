# Fix GitHub Authentication Error (403)

## Problem
You're getting: `remote: Permission denied` or `error: 403`

This happens because GitHub no longer accepts passwords for authentication.

## Solution: Use Personal Access Token

### Step 1: Create a Personal Access Token

1. Go to: **https://github.com/settings/tokens**
2. Click: **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Dashboard Push` (or any name)
4. Set expiration: Choose how long (90 days, 1 year, or no expiration)
5. Select scopes: Check **`repo`** (this gives full control of private repositories)
6. Scroll down and click: **"Generate token"**
7. **IMPORTANT:** Copy the token immediately! It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You won't be able to see it again!

### Step 2: Use the Token

When you push, use:
- **Username:** `majidshwkah` (your GitHub username)
- **Password:** Paste the token you just copied (not your GitHub password!)

### Step 3: Push Again

```bash
git push -u origin main
```

When prompted:
- Username: `majidshwkah`
- Password: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your token)

---

## Alternative: Use SSH (Recommended for Frequent Pushes)

SSH is more secure and you won't need to enter credentials every time.

### Step 1: Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

Press Enter to accept default location. You can set a passphrase (optional).

### Step 2: Copy Your Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519`).

### Step 3: Add to GitHub

1. Go to: **https://github.com/settings/keys**
2. Click: **"New SSH key"**
3. Title: `My Computer` (or any name)
4. Key: Paste the public key you copied
5. Click: **"Add SSH key"**

### Step 4: Change Remote URL to SSH

```bash
git remote set-url origin git@github.com:MajidShwkah/Employee_status.git
```

### Step 5: Push (No Password Needed!)

```bash
git push -u origin main
```

---

## Quick Fix: Use Token in URL (One-Time)

You can also embed the token in the URL (less secure, but works):

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/MajidShwkah/Employee_status.git
git push -u origin main
```

Replace `YOUR_TOKEN` with your actual token.

**Note:** This stores the token in your git config. For security, use SSH instead.

---

## Verify Your Repository

Make sure:
1. Repository exists: https://github.com/MajidShwkah/Employee_status
2. You're the owner (or have write access)
3. Repository name is correct (case-sensitive: `Employee_status` not `employee_status`)

---

## Still Having Issues?

### Check Repository URL
```bash
git remote -v
```

Should show:
```
origin  https://github.com/MajidShwkah/Employee_status.git (fetch)
origin  https://github.com/MajidShwkah/Employee_status.git (push)
```

### Test Connection
```bash
# For HTTPS
git ls-remote https://github.com/MajidShwkah/Employee_status.git

# For SSH
git ls-remote git@github.com:MajidShwkah/Employee_status.git
```

---

## Recommended: Use SSH

SSH is the best option because:
- ✅ No password/token needed after setup
- ✅ More secure
- ✅ Works with all Git operations
- ✅ No expiration (unlike tokens)
