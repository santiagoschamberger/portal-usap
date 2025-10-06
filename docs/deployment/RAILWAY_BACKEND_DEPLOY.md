# Railway Backend Deployment Guide
## For Monorepo (Frontend + Backend in Same Repo)

---

## 🚂 Option 1: Deploy via Railway Dashboard (Recommended)

### Step 1: Sign Up / Login to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `santiagoschamberger/portal-usap`
4. Click **"Deploy Now"**

### Step 3: Configure Service Settings

After deployment starts, you need to configure the root directory:

1. Click on your deployed service
2. Go to **"Settings"** tab
3. Scroll to **"Service Settings"** section
4. Find **"Root Directory"** and set it to: `backend`
5. Find **"Start Command"** and set it to: `npm start`
6. **"Build Command"**: `npm install && npm run build`

### Step 4: Add Environment Variables

1. Still in your service, go to **"Variables"** tab
2. Click **"New Variable"** and add each one:

```bash
SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA5OTc5NCwiZXhwIjoyMDY1Njc1Nzk0fQ.Am9CpPBKzPb_wzCdisF1-htJcYkhLtrMhbLSK3ym3uA

ZOHO_CLIENT_ID=1000.UOXBUB0B4LK17X5FB7BXUM26MR3UBP

ZOHO_CLIENT_SECRET=5cf7b7a0596f8fb96148be1e957ead1d2496093ce8

ZOHO_REFRESH_TOKEN=1000.5ea5c789c27a38ec942b6995cdf4f42c.8ae244a93295eaa80cb0ee72625d13e3

JWT_SECRET=GENERATE_A_NEW_STRONG_SECRET_FOR_PRODUCTION

PORT=3001

NODE_ENV=production
```

**⚠️ IMPORTANT**: Generate a new `JWT_SECRET` for production:
```bash
# Run this locally to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Get Your Railway URL

1. After deployment completes, go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Copy your domain (e.g., `usapayments-backend-production.up.railway.app`)

Your backend will be at: `https://usapayments-backend-production.up.railway.app`

### Step 6: Update Frontend Environment Variable

1. Go to **Vercel** → Your Frontend Project
2. **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_API_URL`
4. Update to: `https://usapayments-backend-production.up.railway.app`
5. Click **"Save"**
6. Go to **Deployments** tab → Click **"..."** → **"Redeploy"**

### Step 7: Update Zoho Redirect URIs

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click on **"Santiago Portal"** app
3. Add production redirect URI:
   ```
   https://your-vercel-frontend.vercel.app/auth/callback
   ```
4. Click **"Update"**

---

## 🚂 Option 2: Deploy via Railway CLI

### Step 1: Install Railway CLI
```bash
# macOS
brew install railway

# Or via npm
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Initialize Project
```bash
cd /Users/santiago/Desktop/DEV/USA\ Payments/usapayments-portal-2.0/backend
railway init
```

Select: **"Create a new project"**

### Step 4: Link to GitHub Repo (Optional)
```bash
railway link
```

### Step 5: Set Environment Variables via CLI
```bash
# Set all environment variables
railway variables set SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA5OTc5NCwiZXhwIjoyMDY1Njc1Nzk0fQ.Am9CpPBKzPb_wzCdisF1-htJcYkhLtrMhbLSK3ym3uA
railway variables set ZOHO_CLIENT_ID=1000.UOXBUB0B4LK17X5FB7BXUM26MR3UBP
railway variables set ZOHO_CLIENT_SECRET=5cf7b7a0596f8fb96148be1e957ead1d2496093ce8
railway variables set ZOHO_REFRESH_TOKEN=1000.5ea5c789c27a38ec942b6995cdf4f42c.8ae244a93295eaa80cb0ee72625d13e3
railway variables set JWT_SECRET=YOUR_GENERATED_SECRET_HERE
railway variables set PORT=3001
railway variables set NODE_ENV=production
```

### Step 6: Create railway.json (Important for Monorepo!)

Create this file in your **project root** (not in backend):

```bash
cd /Users/santiago/Desktop/DEV/USA\ Payments/usapayments-portal-2.0
```

Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 7: Deploy
```bash
railway up
```

### Step 8: Generate Domain
```bash
railway domain
```

Or via dashboard (see Option 1, Step 5).

---

## 🔧 Verify Backend is Working

### Test 1: Health Check
```bash
curl https://your-railway-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX..."
}
```

### Test 2: Zoho Connection
```bash
curl https://your-railway-url.up.railway.app/api/test/zoho-health
```

### Test 3: Check Logs
```bash
# Via CLI
railway logs

# Or via Dashboard
# Go to your service → "Deployments" tab → Click on latest deployment → "View Logs"
```

---

## 📁 Project Structure for Railway

Your monorepo structure:
```
usapayments-portal-2.0/
├── frontend/          # Vercel deploys this
│   ├── package.json
│   └── ...
├── backend/           # Railway deploys this
│   ├── package.json
│   ├── src/
│   └── ...
├── railway.json       # Tells Railway to use backend folder
└── README.md
```

---

## 🎯 Quick Summary

**Railway Configuration:**
- **Root Directory**: `backend` (set in dashboard or via railway.json)
- **Start Command**: `npm start`
- **Build Command**: `npm install && npm run build`
- **Port**: Railway auto-assigns, but backend uses PORT env var

**After Backend Deployment:**
1. ✅ Copy Railway URL
2. ✅ Update `NEXT_PUBLIC_API_URL` in Vercel
3. ✅ Redeploy Vercel frontend
4. ✅ Test end-to-end flow

---

## ⚠️ Common Issues & Solutions

### Issue: "Cannot find module" error
**Solution**: Make sure `railway.json` has `cd backend` before npm commands

### Issue: Port binding error
**Solution**: Railway provides `PORT` env var automatically. Make sure your Express app uses:
```javascript
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Issue: Build succeeds but service crashes
**Solution**: 
1. Check logs: `railway logs`
2. Verify all environment variables are set
3. Ensure `npm start` script exists in `backend/package.json`

### Issue: CORS errors from frontend
**Solution**: Update backend CORS config to allow your Vercel domain:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'
  ],
  credentials: true
}));
```

---

## 🚀 Deployment Checklist

- [ ] Railway project created
- [ ] Root directory set to `backend`
- [ ] All 9 environment variables added
- [ ] Generated new JWT_SECRET for production
- [ ] Railway domain generated
- [ ] Backend health check passes
- [ ] Updated `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Redeployed Vercel frontend
- [ ] Updated Zoho redirect URIs
- [ ] Tested full flow (login → create lead → view in Zoho)

---

**Need help?** Check Railway logs or reach out in the Railway Discord community.

