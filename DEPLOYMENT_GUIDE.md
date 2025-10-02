# 🚀 Deployment Guide - USA Payments Partner Portal

## Quick Start: Deploy to Production

### 📦 **Prerequisites**
- GitHub account
- Vercel account (free tier works)
- Railway/Render account (for backend)
- Supabase project (already set up ✅)

---

## 🎨 **Frontend Deployment (Vercel)**

### Step 1: Push to GitHub
```bash
cd /Users/santiago/Desktop/DEV/USA\ Payments/usapayments-portal-2.0
git add .
git commit -m "feat: add main layout and navigation"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. Click "Deploy"

**🎉 Done! Your frontend will be live at: `https://your-app.vercel.app`**

---

## ⚙️ **Backend Deployment (Railway - Recommended)**

### Why Railway?
- ✅ Simple deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Built-in monitoring
- ✅ $5 credit/month free
- ✅ Easy environment variables

### Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Build Command**: `npm run build`

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

### Step 3: Get Your Backend URL
Railway will provide: `https://your-backend.railway.app`

### Step 4: Update Frontend
Go back to Vercel → Settings → Environment Variables
Update `NEXT_PUBLIC_API_URL` with your Railway URL

**🎉 Done! Your backend is live!**

---

## 🔄 **Alternative: Render (Free Tier)**

### Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Configure:
   - **Name**: usapayments-backend
   - **Environment**: Node
   - **Region**: Choose closest to users
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables (same as Railway above)

**Note:** Free tier spins down after inactivity (cold starts)

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

### Vercel Dashboard
- Monitor deployment status
- View function logs
- Check bandwidth usage

### Railway Dashboard
- Monitor CPU/Memory usage
- View application logs
- Set up health checks

### Supabase Dashboard
- Monitor database usage
- Check query performance
- Review RLS policy hits

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
| **Vercel** | Hobby | $0/month |
| **Railway** | Hobby | ~$5-10/month |
| **Supabase** | Free | $0/month (up to 500MB) |
| **Total** | | **~$5-10/month** |

### Scaling Up
When you need more:
- Vercel Pro: $20/month
- Railway Pro: ~$20-50/month
- Supabase Pro: $25/month

---

## 🔄 **Continuous Deployment**

Both Vercel and Railway support automatic deployments:

1. **Push to GitHub** → Automatically deploys
2. **Pull Request** → Preview deployment
3. **Merge to main** → Production deployment

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


