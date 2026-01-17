# Push to GitHub Repository

## Step 1: Install Git (if not installed)

```bash
sudo apt install git
```

## Step 2: Configure Git (first time only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Initialize Git Repository

```bash
cd /home/majid/Dashboard
git init
```

## Step 4: Add All Files

```bash
git add .
```

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: Employee Status Dashboard"
```

## Step 6: Add Your GitHub Repository as Remote

```bash
git remote add origin https://github.com/MajidShwkah/Employee_status.git
```

## Step 7: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

**Note:** You'll be prompted for your GitHub username and password/token.

### If you get authentication errors:

GitHub no longer accepts passwords. You need a **Personal Access Token**:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "Dashboard Push")
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)
7. Use the token as your password when pushing

Or use SSH (recommended for frequent pushes):

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
# Then use SSH URL:
git remote set-url origin git@github.com:MajidShwkah/Employee_status.git
git push -u origin main
```

---

## Quick One-Liner (if git is already configured)

```bash
cd /home/majid/Dashboard
git init
git add .
git commit -m "Initial commit: Employee Status Dashboard"
git branch -M main
git remote add origin https://github.com/MajidShwkah/Employee_status.git
git push -u origin main
```

---

## After Pushing: Deploy to Vercel

Once your code is on GitHub:

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login
3. Click "Add New Project"
4. Import from GitHub
5. Select your repository: `MajidShwkah/Employee_status`
6. Vercel auto-detects Vite settings
7. Click "Deploy"
8. Done! You'll get a live URL

Every time you push to GitHub, Vercel will automatically redeploy!

---

## Troubleshooting

### "Repository not found"
- Check the repository URL is correct
- Make sure the repository exists on GitHub
- Verify you have access to it

### "Authentication failed"
- Use Personal Access Token instead of password
- Or set up SSH keys

### "Permission denied"
- Make sure you're the owner of the repository
- Or you have write access

### "Nothing to commit"
- Make sure you're in the right directory
- Check if files are already committed: `git status`
