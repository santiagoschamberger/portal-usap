# Railway Deployment Guide - USA Payments Portal

## Overview
This project uses **Railway** for both frontend and backend deployment. Both services are hosted in a single Railway project for unified management and monitoring.

## Project Structure on Railway

```
USA Payments Portal (Railway Project)
├── Frontend Service
│   ├── Root Directory: frontend/
│   ├── Build: npm install && npm run build
│   ├── Start: npm start
│   └── Domain: https://usapayments-frontend.railway.app
│
└── Backend Service
    ├── Root Directory: backend/
    ├── Build: npm install && npm run build
    ├── Start: npm start
    └── Domain: https://usapayments-backend.railway.app
```

## Initial Setup

### 1. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `portal-usap` repository

### 2. Add Frontend Service
1. Click "Add Service" → "GitHub Repo"
2. Select your repository
3. Configure service:
   - **Name**: Frontend
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Click "Deploy"

### 3. Add Backend Service
1. Click "Add Service" → "GitHub Repo"
2. Select your repository again
3. Configure service:
   - **Name**: Backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Click "Deploy"

## Environment Variables

### Frontend Service Variables
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://usapayments-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://usapayments-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://cvzadrvtncnjanoehzhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Service Variables
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

# Frontend URL
FRONTEND_URL=https://usapayments-frontend.railway.app
```

## Generating Public Domains

### For Backend Service
1. Go to Backend Service → Settings
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://usapayments-backend.railway.app`)
4. Update Frontend's `NEXT_PUBLIC_API_URL` with this URL
5. Redeploy Frontend

### For Frontend Service
1. Go to Frontend Service → Settings
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://usapayments-frontend.railway.app`)
4. Update Backend's `FRONTEND_URL` with this URL
5. Update CORS settings if needed
6. Redeploy Backend

## Custom Domains (Optional)

### Add Custom Domain to Frontend
1. Go to Frontend Service → Settings → Domains
2. Click "Custom Domain"
3. Enter your domain (e.g., `portal.usapayments.com`)
4. Add DNS records as instructed by Railway:
   ```
   Type: CNAME
   Name: portal (or @)
   Value: [provided by Railway]
   ```
5. Wait for DNS propagation (5-30 minutes)
6. SSL certificate will be automatically provisioned

### Add Custom Domain to Backend
1. Go to Backend Service → Settings → Domains
2. Click "Custom Domain"
3. Enter your API subdomain (e.g., `api.usapayments.com`)
4. Add DNS records as instructed
5. Update Frontend's `NEXT_PUBLIC_API_URL` to use custom domain
6. Redeploy Frontend

## Deployment Workflow

### Automatic Deployments
Railway automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway automatically:
# 1. Detects changes
# 2. Builds both services
# 3. Deploys to production
# 4. Shows deployment status in dashboard
```

### Manual Deployments
1. Go to Railway Dashboard
2. Select the service (Frontend or Backend)
3. Click "Deploy" → "Redeploy"

### Rollback to Previous Version
1. Go to Railway Dashboard
2. Select the service
3. Click "Deployments" tab
4. Find the previous successful deployment
5. Click "Redeploy"

## Monitoring & Logs

### View Logs
1. Go to Railway Dashboard
2. Select service (Frontend or Backend)
3. Click "Logs" tab
4. View real-time logs
5. Filter by log level (info, warn, error)

### Monitor Resource Usage
1. Go to Railway Dashboard
2. Select service
3. Click "Metrics" tab
4. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Set Up Alerts (Optional)
1. Go to Project Settings
2. Click "Notifications"
3. Add webhook or email for:
   - Deployment failures
   - High resource usage
   - Service crashes

## Troubleshooting

### Frontend Build Fails
**Check:**
- Build logs in Railway dashboard
- Environment variables are set correctly
- `package.json` scripts are correct
- Node version compatibility

**Common fixes:**
```bash
# Ensure build script exists
"scripts": {
  "build": "next build",
  "start": "next start"
}
```

### Backend Build Fails
**Check:**
- TypeScript compilation errors
- Missing dependencies
- Environment variables

**Common fixes:**
```bash
# Ensure build and start scripts exist
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js"
}
```

### Service Won't Start
**Check:**
- Start command is correct
- PORT environment variable
- Required environment variables are set
- Logs for startup errors

### CORS Errors
**Fix:**
1. Update backend CORS configuration
2. Ensure `FRONTEND_URL` matches actual frontend domain
3. Redeploy backend

### Database Connection Fails
**Check:**
- Supabase credentials are correct
- Supabase project is active
- Network connectivity from Railway to Supabase

## Cost Management

### Current Usage
- View in Railway Dashboard → Billing
- Shows usage per service
- Breakdown by CPU, RAM, Network

### Estimated Costs
- **Hobby Plan**: $5 credit/month
- **Typical Usage**: ~$10-20/month for both services
- **No cold starts**: Services stay warm

### Optimize Costs
1. **Right-size resources**: Adjust if over-provisioned
2. **Monitor usage**: Check metrics regularly
3. **Optimize builds**: Cache dependencies
4. **Review logs**: Reduce verbose logging in production

## Health Checks

### Backend Health Endpoint
Create a health check endpoint:

```typescript
// backend/src/index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Configure in Railway
1. Go to Backend Service → Settings
2. Click "Health Check"
3. Set path: `/health`
4. Set interval: 60 seconds
5. Save

## Backup & Recovery

### Database Backups
- Handled by Supabase automatically
- Daily backups retained for 7 days (Free tier)
- Point-in-time recovery available (Pro tier)

### Code Backups
- All code in GitHub
- Railway keeps deployment history
- Can rollback to any previous deployment

### Environment Variables Backup
1. Export from Railway dashboard
2. Store securely (1Password, etc.)
3. Document in team wiki

## Security Best Practices

### Environment Variables
- ✅ Never commit secrets to Git
- ✅ Use Railway's encrypted variables
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/prod

### Access Control
- ✅ Limit Railway project access
- ✅ Use GitHub branch protection
- ✅ Require PR reviews
- ✅ Enable 2FA on Railway account

### Network Security
- ✅ Railway provides automatic HTTPS
- ✅ Configure CORS properly
- ✅ Use Supabase RLS policies
- ✅ Implement rate limiting

## Support & Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Project-Specific Help
- Check `docs/` folder for guides
- Review Railway deployment logs
- Contact team lead for access issues

## Quick Reference Commands

```bash
# View project status
railway status

# View logs
railway logs

# Deploy manually
railway up

# Add environment variable
railway variables set KEY=value

# Link to project (first time)
railway link
```

## Deployment Checklist

Before deploying new features:

- [ ] Test locally
- [ ] Update environment variables if needed
- [ ] Check for breaking changes
- [ ] Review Railway build logs
- [ ] Test on Railway preview deployment
- [ ] Monitor logs after deployment
- [ ] Verify both services are running
- [ ] Test critical user flows
- [ ] Check Zoho integration still works
- [ ] Verify database connections

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Railway Project**: USA Payments Portal

