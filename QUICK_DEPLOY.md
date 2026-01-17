# Quick Deploy Guide

## 🚀 Deploy to Vercel (5 minutes)

### Option 1: Via Web (Easiest)

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign up (free)
   - Click "Add New Project"
   - Drag and drop the `dist` folder
   - Click "Deploy"

3. **Done!** You'll get a URL like: `your-dashboard.vercel.app`

### Option 2: Via Git (Auto-deploy)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to vercel.com
   - Import from GitHub
   - Vercel auto-detects everything
   - Click "Deploy"

3. **Auto-updates:** Every `git push` = new deployment!

---

## 🏢 Run Locally in Office (10 minutes)

### Quick Start:

```bash
# Run the local server script
./start-local-server.sh
```

Or manually:

```bash
# Build
npm run build

# Install http-server (if not installed)
npm install -g http-server

# Start server
cd dist
http-server -p 8080
```

### Access:
- **On same computer:** http://localhost:8080
- **From other devices:** http://YOUR_IP:8080
  - Find your IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)

---

## 📺 Setup Office Screen

### Windows:
1. Create shortcut: `chrome.exe --kiosk http://your-url`
2. Add to Startup folder
3. Disable sleep in Power Settings

### Linux (Raspberry Pi):
1. Install Chromium: `sudo apt install chromium-browser`
2. Create autostart file: `~/.config/autostart/dashboard.desktop`
3. Add:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=Dashboard
   Exec=chromium-browser --kiosk http://your-url
   ```

### macOS:
1. Use Automator to create app
2. Add to Login Items
3. Set browser to fullscreen

---

## 🔗 Share with Employees

Once deployed, share the URL:
- **Vercel:** `https://your-dashboard.vercel.app`
- **Netlify:** `https://your-dashboard.netlify.app`
- **Local:** `http://YOUR_IP:8080` (office network only)

Employees can:
- View on phones/tablets
- Bookmark for quick access
- Access from anywhere (if using Vercel/Netlify)

---

## ✅ Checklist

- [ ] Build project: `npm run build`
- [ ] Deploy to Vercel (or run locally)
- [ ] Test on multiple devices
- [ ] Set up office screen (kiosk mode)
- [ ] Share URL with employees
- [ ] Configure auto-start (optional)
- [ ] Set up auto-refresh (optional)

---

**Need help?** Check `HOSTING_GUIDE.md` for detailed instructions.
