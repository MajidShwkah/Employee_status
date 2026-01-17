# Hosting Guide for Employee Status Dashboard

This guide covers the best options for hosting your dashboard so all employees can access it and display it on office screens.

## 🏆 **Recommended: Vercel (Easiest & Free)**

**Best for:** Quick deployment, automatic updates, free hosting, global CDN

### Steps:

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Install Vercel CLI (optional, or use web interface):**
   ```bash
   npm install -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Or use the web interface at [vercel.com](https://vercel.com)

4. **Configure:**
   - Connect your GitHub/GitLab repo (optional but recommended)
   - Every push automatically deploys
   - Get a free URL like: `your-dashboard.vercel.app`

5. **For office screen:**
   - Open the URL in a browser on the office screen
   - Set browser to fullscreen (F11) or use kiosk mode
   - Set browser to auto-refresh or keep it open

**Pros:**
- ✅ Free tier (more than enough for this)
- ✅ Automatic HTTPS
- ✅ Global CDN (fast worldwide)
- ✅ Automatic deployments from Git
- ✅ Custom domain support (free)
- ✅ No server management

**Cons:**
- ⚠️ Requires internet connection

---

## 🥈 **Alternative: Netlify (Similar to Vercel)**

**Best for:** Similar to Vercel, also excellent

### Steps:

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder (after `npm run build`)
   - Or connect your Git repo for auto-deployments

3. **Get URL:**
   - Free URL like: `your-dashboard.netlify.app`

**Pros:**
- ✅ Free tier
- ✅ Automatic HTTPS
- ✅ Easy drag-and-drop deployment
- ✅ Custom domain support

---

## 🥉 **Option 3: Local Network Hosting (Office Only)**

**Best for:** Office-only access, no internet required, maximum privacy

### Option A: Simple HTTP Server (Easiest)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Install a simple HTTP server:**
   ```bash
   npm install -g http-server
   ```

3. **Run on your office computer:**
   ```bash
   cd dist
   http-server -p 8080
   ```

4. **Access from office network:**
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
   - Access from any device: `http://YOUR_IP:8080`
   - Example: `http://192.168.1.100:8080`

5. **For office screen:**
   - Open the local IP in a browser
   - Set to fullscreen/kiosk mode

**Pros:**
- ✅ No internet required
- ✅ Fast (local network)
- ✅ Complete privacy
- ✅ Free

**Cons:**
- ⚠️ Only accessible in office
- ⚠️ Computer must stay on
- ⚠️ No automatic HTTPS (not needed for local)

### Option B: Raspberry Pi / Mini PC (Dedicated)

1. Set up a Raspberry Pi or small PC
2. Install Node.js
3. Run the build and serve it
4. Connect to office network
5. Access from any device on network

**Pros:**
- ✅ Dedicated device (always on)
- ✅ Low power consumption
- ✅ Can run 24/7

---

## 🌐 **Option 4: Traditional Web Hosting**

**Best for:** If you already have hosting

### Providers:
- **DigitalOcean** ($5/month)
- **Linode** ($5/month)
- **AWS Amplify** (free tier available)
- **Google Cloud Run** (free tier available)
- **Azure Static Web Apps** (free tier available)

### Steps (general):
1. Build: `npm run build`
2. Upload `dist` folder to hosting
3. Configure web server (nginx, Apache, etc.)
4. Set up domain (optional)

---

## 📱 **For Office Screen Display**

### Recommended Setup:

1. **Use a dedicated device:**
   - Raspberry Pi
   - Old laptop/tablet
   - Mini PC
   - Android TV box

2. **Browser setup:**
   - **Chrome/Edge:** Use kiosk mode
     - Windows: `chrome.exe --kiosk --app=http://your-url`
     - Linux: `chromium-browser --kiosk http://your-url`
   - **Firefox:** Use fullscreen addon
   - **Opera:** Built-in kiosk mode

3. **Auto-start on boot:**
   - Windows: Add to Startup folder
   - Linux: Use systemd service or `.bashrc`
   - Raspberry Pi: Add to `/etc/xdg/autostart/`

4. **Auto-refresh (optional):**
   - Browser extension (e.g., "Auto Refresh")
   - Or add meta refresh tag in HTML

5. **Power management:**
   - Disable sleep/hibernate
   - Keep screen on
   - Use screen saver timeout (optional)

---

## 🚀 **Quick Start: Deploy to Vercel (Recommended)**

### Method 1: Via Web Interface (Easiest)

1. **Build your project:**
   ```bash
   npm run build
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign up (free, use GitHub/Google)
   - Click "Add New Project"
   - Drag and drop the `dist` folder
   - Deploy!

3. **Get your URL:**
   - You'll get: `your-dashboard-xyz.vercel.app`
   - Share this URL with employees
   - Open on office screen

### Method 2: Via Git (Auto-deploy)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Import project from GitHub
   - Vercel auto-detects Vite
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Deploy!

3. **Auto-updates:**
   - Every `git push` = automatic deployment
   - Zero downtime updates

---

## 🔒 **Security Considerations**

1. **Supabase RLS:** Already configured ✅
2. **HTTPS:** Vercel/Netlify provide free SSL ✅
3. **Environment Variables:** Don't commit Supabase keys
   - Use Vercel/Netlify environment variables
   - Or use `.env` file (already in .gitignore)

---

## 📊 **Comparison Table**

| Option | Cost | Setup Time | Internet Required | Best For |
|-------|------|------------|-------------------|----------|
| **Vercel** | Free | 5 min | Yes | Most users |
| **Netlify** | Free | 5 min | Yes | Most users |
| **Local Server** | Free | 10 min | No | Office only |
| **Raspberry Pi** | $35+ | 30 min | No | Dedicated display |
| **Cloud Hosting** | $5+/mo | 15 min | Yes | Enterprise |

---

## 🎯 **My Recommendation**

**For your use case (office dashboard on local screen):**

1. **Primary:** Deploy to **Vercel** (free, easy, accessible everywhere)
2. **Office Screen:** Use a dedicated device (Raspberry Pi or old laptop)
3. **Setup:** 
   - Open Vercel URL in browser
   - Set to kiosk mode
   - Auto-start on boot
   - Disable sleep

**Why Vercel?**
- ✅ Free forever
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ Zero maintenance
- ✅ Easy updates (just push to Git)
- ✅ Works on any device (phones, tablets, computers)
- ✅ Accessible from anywhere (not just office)

---

## 🛠️ **Troubleshooting**

### Build Issues:
```bash
# Make sure all dependencies are installed
npm install

# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Issues:
- Check `dist` folder exists after build
- Verify `vite.config.js` is correct
- Check browser console for errors
- Verify Supabase URL and keys are correct

### Office Screen Issues:
- Use kiosk mode to prevent accidental navigation
- Disable browser updates (if possible)
- Set up auto-refresh (every 5-10 minutes)
- Use wired connection for stability

---

## 📝 **Next Steps**

1. Choose your hosting option (I recommend Vercel)
2. Build and deploy
3. Test on multiple devices
4. Set up office screen
5. Share URL with employees

Need help with a specific option? Let me know!
