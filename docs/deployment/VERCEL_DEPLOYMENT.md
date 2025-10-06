# Vercel Deployment Guide

## 🚀 Deploying USA Payments Portal to Vercel

### Part 1: Frontend Deployment (Next.js)

#### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `santiagoschamberger/portal-usap`
4. Select the **frontend** directory as the root directory
5. Framework Preset: **Next.js** (auto-detected)

#### Step 2: Configure Build Settings

**Root Directory**: `frontend`

**Build Command**: `npm run build`

**Output Directory**: `.next` (default)

**Install Command**: `npm install`

#### Step 3: Add Environment Variables

In the Vercel project settings → **Environment Variables**, add these:

```bash
# Supabase Configuration (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8

# Backend API URL (Update after backend deployment)
NEXT_PUBLIC_API_URL=https://your-backend-url.herokuapp.com
```

**Important**: You'll need to update `NEXT_PUBLIC_API_URL` after deploying the backend (see Part 2).

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your frontend will be live at: `https://your-project-name.vercel.app`

---

### Part 2: Backend Deployment (Node.js/Express)

**Note**: Vercel is optimized for serverless functions. For a traditional Express backend, we recommend **Heroku** or **Railway**.

#### Option A: Deploy to Heroku (Recommended)

##### 1. Install Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
```

##### 2. Login to Heroku
```bash
heroku login
```

##### 3. Create Heroku App
```bash
cd backend
heroku create usapayments-portal-backend
```

##### 4. Add Environment Variables to Heroku
```bash
heroku config:set \
  SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co \
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTk3OTQsImV4cCI6MjA2NTY3NTc5NH0.4lJMgOpNBH6TDQJt6lNbm6gUeueXqc65Liw64sdnHj8 \
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2emFkcnZ0bmNuamFub2VoemhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA5OTc5NCwiZXhwIjoyMDY1Njc1Nzk0fQ.Am9CpPBKzPb_wzCdisF1-htJcYkhLtrMhbLSK3ym3uA \
  ZOHO_CLIENT_ID=1000.UOXBUB0B4LK17X5FB7BXUM26MR3UBP \
  ZOHO_CLIENT_SECRET=5cf7b7a0596f8fb96148be1e957ead1d2496093ce8 \
  ZOHO_REFRESH_TOKEN=1000.5ea5c789c27a38ec942b6995cdf4f42c.8ae244a93295eaa80cb0ee72625d13e3 \
  JWT_SECRET=usa_payments_production_jwt_secret_CHANGE_THIS_IN_PRODUCTION \
  PORT=3001 \
  NODE_ENV=production
```

##### 5. Add Heroku Remote (if not done automatically)
```bash
git remote add heroku https://git.heroku.com/usapayments-portal-backend.git
```

##### 6. Create Procfile for Heroku
Create `backend/Procfile`:
```
web: npm start
```

##### 7. Deploy to Heroku
```bash
git subtree push --prefix backend heroku main
```

Or if you prefer to deploy the whole repo:
```bash
# From project root
git push heroku main
```

##### 8. Verify Deployment
```bash
heroku logs --tail
heroku open
```

Your backend will be at: `https://usapayments-portal-backend.herokuapp.com`

##### 9. Update Frontend Environment Variable

Go back to Vercel → Your Frontend Project → Settings → Environment Variables

Update:
```bash
NEXT_PUBLIC_API_URL=https://usapayments-portal-backend.herokuapp.com
```

Then redeploy the frontend.

---

#### Option B: Deploy Backend to Railway

##### 1. Sign up at [Railway.app](https://railway.app)

##### 2. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose `santiagoschamberger/portal-usap`
- Set root directory to `backend`

##### 3. Add Environment Variables (Same as Heroku list above)

##### 4. Deploy
Railway will auto-deploy. Your backend URL will be: `https://your-app.railway.app`

##### 5. Update Frontend
Same as step 9 in Heroku instructions.

---

### Part 3: Configure Zoho Webhooks

Once your backend is deployed, configure Zoho webhooks to point to your production backend:

#### 1. Partner Registration Webhook
**URL**: `https://your-backend-url/api/webhooks/zoho/partner`
**Method**: POST
**Trigger**: When a partner is approved in Zoho CRM

#### 2. Lead Status Update Webhook
**URL**: `https://your-backend-url/api/webhooks/zoho/lead-status`
**Method**: POST
**Trigger**: When lead status changes in Zoho CRM

#### 3. Contact/Sub-Account Webhook
**URL**: `https://your-backend-url/api/webhooks/zoho/contact`
**Method**: POST
**Trigger**: When a new contact is created in Zoho CRM

---

### Part 4: Update Zoho Redirect URIs

In your Zoho API Console → **Santiago Portal** app:

**Add Production Redirect URI**:
```
https://your-vercel-frontend.vercel.app/auth/callback
```

Keep the localhost one for development:
```
http://localhost:3000/auth/callback
```

---

## 📝 Complete Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_API_URL` (Update after backend deployment)

### Backend (Heroku/Railway)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ZOHO_CLIENT_ID`
- [ ] `ZOHO_CLIENT_SECRET`
- [ ] `ZOHO_REFRESH_TOKEN`
- [ ] `JWT_SECRET` (Generate new one for production!)
- [ ] `PORT` (3001)
- [ ] `NODE_ENV` (production)

---

## 🔒 Security Checklist

Before going live:

- [ ] **Change JWT_SECRET** to a strong random value
- [ ] Review Supabase RLS policies
- [ ] Enable HTTPS only in production
- [ ] Set up CORS properly (allow only your Vercel domain)
- [ ] Review all API endpoints for authentication
- [ ] Enable rate limiting on public endpoints
- [ ] Set up monitoring (Sentry, LogRocket, etc.)

---

## 🧪 Post-Deployment Testing

1. **Health Check**: Visit `https://your-backend-url/health`
2. **Zoho Test**: Run health check endpoint
3. **Frontend**: Test login/registration flow
4. **Lead Creation**: Create a test lead and verify it appears in Zoho
5. **Dashboard**: Check that statistics load correctly
6. **Webhooks**: Trigger a webhook from Zoho and verify it updates the portal

---

## 🆘 Troubleshooting

### Frontend builds but shows errors
- Check browser console for API connection errors
- Verify `NEXT_PUBLIC_API_URL` is correct and accessible
- Check CORS settings on backend

### Backend deployment fails
- Check build logs for missing dependencies
- Verify all environment variables are set
- Ensure `package.json` has correct start script

### Zoho integration not working
- Verify refresh token hasn't expired
- Check webhook URLs are accessible (not behind firewall)
- Ensure redirect URIs include production domain

### Database connection issues
- Verify Supabase credentials are correct
- Check Supabase project is active
- Review connection pooling settings

---

## 🎯 Quick Deploy Commands Summary

```bash
# 1. Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. Deploy Frontend to Vercel (via dashboard)
# - Import GitHub repo
# - Set root to "frontend"
# - Add environment variables
# - Deploy

# 3. Deploy Backend to Heroku
cd backend
heroku create usapayments-portal-backend
heroku config:set [ALL_ENV_VARS]
git subtree push --prefix backend heroku main

# 4. Update Frontend API URL
# - Update NEXT_PUBLIC_API_URL in Vercel
# - Redeploy frontend

# 5. Configure Zoho webhooks
# - Add production webhook URLs
# - Add production redirect URIs
```

---

**Deployment Status**: 
- ✅ Code pushed to GitHub
- ⏳ Frontend deployment pending
- ⏳ Backend deployment pending
- ⏳ Environment variables configuration pending
- ⏳ Zoho webhooks configuration pending

