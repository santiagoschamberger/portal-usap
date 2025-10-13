# 🚀 Deployment Guide - USA Payments Partner Portal

## Quick Start: Deploy to Production

### 📦 **Prerequisites**
- GitHub account
- Railway account (used for both frontend and backend)
- Supabase project (already set up ✅)

---

## 🎨 **Frontend Deployment (Railway)**

### Step 1: Push to GitHub
```bash
cd /Users/santiago/Desktop/DEV/USA\ Payments/usapayments-portal-2.0
git add .
git commit -m "feat: add main layout and navigation"
git push origin main
```

### Step 2: Deploy Frontend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Click "Add Service" → "GitHub Repo"
6. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

7. Add Environment Variables in Railway dashboard:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-service.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

8. Generate Domain: Settings → Generate Domain

**🎉 Done! Your frontend will be live at: `https://your-frontend.railway.app`**

---

## ⚙️ **Backend Deployment (Railway)**

### Why Railway for Both?
- ✅ Simple deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Built-in monitoring
- ✅ Easy environment variables
- ✅ Unified platform for frontend and backend
- ✅ Internal networking between services

### Step 1: Deploy Backend to Railway

1. In the same Railway project (or create new)
2. Click "Add Service" → "GitHub Repo"
3. Choose your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 2: Environment Variables

Add these in Railway dashboard:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database
SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here

# Zoho CRM
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# Frontend (Railway will give you this URL)
FRONTEND_URL=https://your-app.vercel.app
```

### Step 3: Generate Domain
1. Go to Backend Service → Settings → Generate Domain
2. Copy the backend URL: `https://your-backend.railway.app`

### Step 4: Update Frontend Environment Variables
1. Go to Frontend Service → Variables
2. Update `NEXT_PUBLIC_API_URL` with your backend Railway URL
3. Update `NEXT_PUBLIC_SOCKET_URL` with your backend Railway URL
4. Redeploy frontend service

**🎉 Done! Both services are live!**

---

## 🔗 **Railway Project Structure**

Your Railway project should have **two services**:

```
USA Payments Portal (Project)
├── Frontend Service
│   ├── Root: frontend/
│   ├── Domain: https://your-frontend.railway.app
│   └── Environment: NODE_ENV, NEXT_PUBLIC_*
│
└── Backend Service
    ├── Root: backend/
    ├── Domain: https://your-backend.railway.app
    └── Environment: NODE_ENV, SUPABASE_*, ZOHO_*, JWT_*
```

### Benefits of Single Railway Project:
- ✅ Unified billing and monitoring
- ✅ Shared environment variables (if needed)
- ✅ Easy service-to-service communication
- ✅ Single dashboard for both services

---

## 📋 **Before You Deploy Checklist**

### Frontend
- [ ] Install missing dependencies:
  ```bash
  cd frontend
  npm install @radix-ui/react-avatar @radix-ui/react-dropdown-menu
  ```
- [ ] Build works locally: `npm run build`
- [ ] Environment variables are set

### Backend
- [ ] Build works locally: `npm run build`
- [ ] All environment variables documented
- [ ] Database migrations applied ✅
- [ ] Zoho credentials refreshed

### Database
- [ ] Schema applied ✅
- [ ] RLS policies enabled ✅
- [ ] Indexes created ✅

---

## 🔒 **Security Checklist**

- [ ] Change all default secrets
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS only (Vercel/Railway do this automatically)
- [ ] Set up CORS properly (only your frontend URL)
- [ ] Rotate Zoho credentials if exposed
- [ ] Enable rate limiting in production
- [ ] Set up monitoring/alerts

---

## 📊 **Post-Deployment Monitoring**

### Railway Dashboard (Both Services)
- Monitor deployment status for frontend and backend
- View application logs for each service
- Monitor CPU/Memory usage
- Check bandwidth usage
- Set up health checks
- View build logs and deployment history

### Supabase Dashboard
- Monitor database usage
- Check query performance
- Review RLS policy hits
- Monitor API requests

---

## 🚨 **Common Issues**

### Issue: Frontend can't connect to backend
**Solution:** Check CORS settings in backend, verify API URL

### Issue: Database connection fails
**Solution:** Verify Supabase credentials, check if IP is allowed

### Issue: Zoho API not working
**Solution:** Refresh Zoho tokens, verify API scopes

### Issue: Cold starts on free tier
**Solution:** Upgrade to paid tier or use Railway

---

## 💰 **Estimated Monthly Costs**

| Service | Tier | Cost |
|---------|------|------|
| **Railway** (Frontend + Backend) | Hobby | ~$10-20/month |
| **Supabase** | Free | $0/month (up to 500MB) |
| **Total** | | **~$10-20/month** |

### Cost Breakdown:
- Railway charges based on usage (CPU, RAM, Network)
- Two services in one project share the $5 monthly credit
- Typical usage: ~$10-20/month for both services
- No cold starts (unlike free tiers on other platforms)

### Scaling Up
When you need more:
- Railway Pro: ~$20-50/month per service
- Supabase Pro: $25/month
- Custom domains: Free on Railway

---

## 🔄 **Continuous Deployment**

Railway supports automatic deployments for both services:

1. **Push to GitHub** → Both services automatically deploy
2. **Pull Request** → Preview deployments available
3. **Merge to main** → Production deployment for both
4. **Rollback** → Easy one-click rollback to previous versions

---

## 📝 **Quick Commands**

```bash
# Frontend - Local Development
cd frontend
npm run dev         # http://localhost:3000

# Backend - Local Development  
cd backend
npm run dev         # http://localhost:5001

# Build for Production
npm run build       # Both frontend and backend

# Test Production Build Locally
npm start           # Start production server
```

---

## ✅ **What's Already Done**

- ✅ Database schema applied
- ✅ Backend API running
- ✅ Frontend components created
- ✅ Main layout built
- ✅ Navigation system complete
- ✅ Authentication setup
- ✅ Protected routes working

---

## 🎯 **Next Steps After Deployment**

1. Test the full user flow
2. Set up custom domain (optional)
3. Configure email notifications
4. Add analytics (Google Analytics, etc.)
5. Set up error tracking (Sentry)
6. Create backup strategy

---

**Need help?** Check:
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs

---

**Estimated Deployment Time:** 30-45 minutes for first deployment



