# 🚂 Railway Frontend Deployment Fix

## Problem
Your Railway frontend service is showing "Cannot GET /" because Railway is likely trying to deploy the wrong directory or missing the proper Next.js configuration.

## Solution: Configure Railway Frontend Service

### Understanding the Setup
You should have **TWO separate Railway services**:
1. **Backend Service** - Express API (already working ✅)
2. **Frontend Service** - Next.js app (needs fixing ⚠️)

---

## Fix Option 1: Configure via Railway Dashboard (Recommended)

### Step 1: Open Your Frontend Service
1. Go to https://railway.app/dashboard
2. Open your **frontend** service/project
3. Go to **Settings**

### Step 2: Set Root Directory
1. Find **Root Directory** setting
2. Set it to: `frontend`
3. Click **Save**

### Step 3: Configure Build Settings

#### Service Settings:
- **Root Directory**: `frontend`
- **Builder**: NIXPACKS (default)
- **Watch Paths**: Leave empty or set to `frontend/**`

#### Build Command (Custom):
```bash
npm install && npm run build
```

#### Start Command (Custom):
```bash
npm start
```

### Step 4: Add Environment Variables
In the frontend Railway service, add these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8

# Backend API URL (Your working Railway backend)
NEXT_PUBLIC_API_URL=https://backend-production-67e9.up.railway.app

# Node Environment
NODE_ENV=production

# Port (Railway will auto-assign, but this is the default)
PORT=3000
```

### Step 5: Trigger Redeploy
1. In Railway dashboard, go to **Deployments**
2. Click **Deploy** → **Redeploy**
3. Or push any change to trigger auto-deploy

---

## Fix Option 2: Create Separate Railway Config File

If you want to use configuration files, create a separate `railway.frontend.json`:

### 1. Create Frontend Config File
I'll create this file for you in the next step.

### 2. In Railway Dashboard
- Delete the current frontend service (if it exists)
- Create a new service
- Link it to your GitHub repo
- When setting up, tell Railway to use the `railway.frontend.json` file

---

## Fix Option 3: Deploy Both Services Correctly

### Current Setup Issue:
Your `railway.json` is only configured for backend. Railway might be confused about which service to deploy.

### Correct Approach:

#### Option A: One Repo, Two Railway Services (Recommended)
1. **Backend Service**:
   - Set Root Directory: `backend`
   - Use existing backend configuration
   
2. **Frontend Service** (New/Separate):
   - Set Root Directory: `frontend`
   - Configure as described in Fix Option 1

#### Option B: Use Railway Config Files
Keep your existing `railway.json` for backend, and create a new one for frontend.

---

## Create Frontend Railway Config

Let me create a proper `railway.toml` file for the frontend:

**File: `frontend/railway.toml`**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
PORT = "3000"
```

---

## After Deployment: Verify Everything Works

### 1. Check Frontend URL
Visit your Railway frontend URL (e.g., `https://frontend-production-xxxx.up.railway.app`)

You should see:
- ✅ Partner Portal landing page
- ✅ "Sign In" button
- ✅ Features card

### 2. Check API Connection
1. Open browser DevTools (F12)
2. Go to Console tab
3. Should not see CORS or connection errors

### 3. Test Authentication
1. Click "Sign In"
2. Try to login (if you have credentials)
3. Should successfully connect to backend

---

## Common Railway Deployment Issues & Fixes

### Issue: "Cannot GET /" persists
**Cause**: Root directory not set correctly
**Fix**: 
- Set Root Directory to `frontend` in Railway settings
- Verify in Settings → Service → Root Directory

### Issue: Build fails with "next: command not found"
**Cause**: Dependencies not installed properly
**Fix**:
- Verify `frontend/package.json` exists
- Check build command includes `npm install`
- Try: `npm install && npm run build`

### Issue: "Module not found" errors
**Cause**: Missing dependencies or wrong Node version
**Fix**:
- Add all dependencies to `frontend/package.json`
- Set Node version: Add `NODE_VERSION=20` to environment variables

### Issue: Frontend builds but shows blank page
**Cause**: Environment variables not set
**Fix**:
- Add all `NEXT_PUBLIC_*` variables
- Must redeploy after adding env vars

### Issue: Can't connect to backend
**Cause**: CORS or wrong API URL
**Fix**:
- Verify `NEXT_PUBLIC_API_URL` matches your backend URL
- Check backend CORS allows your frontend domain
- Update backend `FRONTEND_URL` env var to include Railway frontend URL

---

## Backend CORS Update

Your backend needs to allow your Railway frontend URL. Update the backend's environment variables:

### In Backend Railway Service:
Add or update:
```bash
FRONTEND_URL=https://your-frontend-production-xxxx.up.railway.app
```

This ensures the backend accepts requests from your Railway frontend.

---

## Current Status

✅ **Backend**: Working correctly
- URL: https://backend-production-67e9.up.railway.app
- Returns API info at root
- Health endpoint works

⚠️ **Frontend**: Needs configuration
- [ ] Set Root Directory to `frontend`
- [ ] Add environment variables
- [ ] Configure build/start commands
- [ ] Redeploy

---

## Quick Action Steps

**Do this RIGHT NOW:**

1. Open Railway Dashboard → Frontend Service
2. Settings → Root Directory → Set to `frontend`
3. Settings → Environment Variables → Add the 3 variables above
4. Deployments → Redeploy

**Your frontend should work in ~2-3 minutes after redeploying!**

---

## Need Both URLs?

After both are deployed:

- **Backend API**: https://backend-production-67e9.up.railway.app
- **Frontend App**: https://frontend-production-xxxx.up.railway.app (you'll get this after deploy)

Make sure to:
1. Update `NEXT_PUBLIC_API_URL` in frontend to point to backend
2. Update `FRONTEND_URL` in backend to point to frontend
3. This enables proper CORS and communication between services

