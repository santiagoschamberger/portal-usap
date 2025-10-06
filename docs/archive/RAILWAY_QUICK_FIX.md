# 🚂 Quick Railway Frontend Fix

## Problem
Frontend showing "Cannot GET /" because Railway is deploying from wrong directory.

## ⚡ Quick Fix (Do This Now)

### Step 1: Open Railway Dashboard
Go to: https://railway.app/dashboard

### Step 2: Configure Frontend Service

#### Settings to Change:
1. **Root Directory**: Set to `frontend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`

#### Environment Variables to Add:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8

NEXT_PUBLIC_API_URL=https://backend-production-67e9.up.railway.app

NODE_ENV=production
```

### Step 3: Redeploy
Click the **Deploy** button or push the latest commit (just pushed ✅)

### Step 4: Update Backend CORS
In your **backend** Railway service, add this environment variable:
```bash
FRONTEND_URL=https://your-frontend-url.up.railway.app
```
(Update with your actual frontend URL after it deploys)

---

## What I Did

✅ Created `frontend/railway.toml` - Railway config for frontend  
✅ Moved `railway.json` to `backend/railway.json` - Organized backend config  
✅ Created detailed fix guide in `RAILWAY_FRONTEND_FIX.md`  
✅ Pushed all changes to GitHub  

---

## After It Works

Your Railway setup will be:

1. **Backend Service** ✅
   - URL: https://backend-production-67e9.up.railway.app
   - Root: `backend/`
   - Status: Working

2. **Frontend Service** (fixing now)
   - URL: https://frontend-production-xxxx.up.railway.app
   - Root: `frontend/`
   - Status: Will work after redeploy

---

## Testing Checklist

After frontend deploys:
- [ ] Visit frontend URL - should show Partner Portal
- [ ] Click "Sign In" - should show login page
- [ ] Check browser console - no CORS errors
- [ ] Try to login - should connect to backend

---

**Need more details?** Check `RAILWAY_FRONTEND_FIX.md` for comprehensive troubleshooting!

