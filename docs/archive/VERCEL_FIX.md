# 🔧 Vercel Frontend Deployment Fix

## Problem
Your Vercel deployment is showing "Cannot GET /" because Vercel is trying to deploy from the root directory instead of the `frontend` directory.

## Solution: Configure Vercel Project Settings

### Step 1: Go to Vercel Project Settings

1. Open your Vercel dashboard: https://vercel.com/dashboard
2. Find your project (frontend deployment)
3. Click on the project name
4. Go to **Settings** (gear icon in the top right)

### Step 2: Configure Root Directory

1. In Settings, find the **General** section
2. Look for **Root Directory**
3. Click **Edit**
4. Set it to: `frontend`
5. Click **Save**

### Step 3: Verify Build Settings

Make sure these settings are correct:

- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `frontend` ← CRITICAL
- **Build Command**: `npm run build` (default is fine)
- **Output Directory**: `.next` (default is fine)
- **Install Command**: `npm install` (default is fine)
- **Node Version**: 20.x (recommended)

### Step 4: Add Environment Variables

Go to **Settings** → **Environment Variables** and add these three:

```bash
# Variable 1
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://cvzadrvtncnjanoehzhj.supabase.co
Environment: Production, Preview, Development

# Variable 2
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8
Environment: Production, Preview, Development

# Variable 3
Name: NEXT_PUBLIC_API_URL
Value: https://backend-production-67e9.up.railway.app
Environment: Production, Preview, Development
```

**Note**: I'm using your Railway backend URL. Update this if it's different!

### Step 5: Trigger Redeploy

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Select **Redeploy**
4. Or simply push a small change to trigger auto-deploy

### Step 6: Verify Deployment

After redeployment:
1. Visit your Vercel URL
2. You should see the Partner Portal homepage
3. Try clicking "Sign In" to verify routing works

---

## Alternative: Redeploy from Scratch

If the above doesn't work, delete and recreate the project:

### 1. Delete Current Vercel Project
- Settings → Advanced → Delete Project

### 2. Create New Project
1. Click **Add New...** → **Project**
2. Import your GitHub repo: `santiagoschamberger/portal-usap`
3. **IMPORTANT**: Before deploying, click **Configure Project**
4. Set **Root Directory** to `frontend`
5. Add all three environment variables (see Step 4 above)
6. Click **Deploy**

---

## Quick Test After Deployment

Visit these URLs to verify:

1. **Homepage**: `https://your-project.vercel.app/`
   - Should show "Partner Portal" landing page

2. **Login Page**: `https://your-project.vercel.app/auth/login`
   - Should show login form

3. **API Connection**: Open browser console on homepage
   - Should not see CORS or connection errors

---

## Common Issues & Fixes

### Issue: Still seeing "Cannot GET /"
- **Solution**: Double-check Root Directory is set to `frontend`
- Try clearing Vercel cache: Settings → Advanced → Clear Cache

### Issue: Build fails with module errors
- **Solution**: Verify `frontend/package.json` has all dependencies
- Check Node version matches (20.x recommended)

### Issue: Frontend loads but can't connect to backend
- **Solution**: 
  1. Verify `NEXT_PUBLIC_API_URL` is correct
  2. Check backend is running: visit Railway URL
  3. Verify CORS is configured on backend (allow Vercel domain)

### Issue: Environment variables not working
- **Solution**: Environment variables MUST have `NEXT_PUBLIC_` prefix for client-side access
- After adding/changing env vars, you MUST redeploy

---

## Current Deployment Status

✅ **Backend**: Deployed and working on Railway
- URL: https://backend-production-67e9.up.railway.app
- Status: ✅ Returns API info at root

⏳ **Frontend**: Needs Root Directory configuration
- Action Required: Set Root Directory to `frontend`
- Then: Redeploy

---

## Next Steps After Frontend Works

1. Test full authentication flow
2. Create a test lead
3. Verify data syncs to Zoho CRM
4. Set up custom domain (optional)
5. Configure Zoho webhooks to point to production URLs

---

Need help? Check Vercel deployment logs for specific errors!

