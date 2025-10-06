# Quick Start Guide

## ✅ Current Status

Your environment files are **already configured**! Here's what we found:

### Backend `.env` (Already exists!)
```bash
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY
✅ ZOHO_CLIENT_ID
✅ ZOHO_CLIENT_SECRET
✅ ZOHO_REFRESH_TOKEN
✅ JWT_SECRET (just added)
✅ PORT=3001 (just added)
```

### Frontend `.env.local` (Already exists!)
```bash
✅ NEXT_PUBLIC_API_URL=http://localhost:3001 (just fixed)
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## ⚠️ Zoho Refresh Token Issue

When we tested the Zoho connection, we got:
```
✅ Environment Variables: All set
✅ Authentication: Got access token
❌ API Connectivity: Authentication failed
```

**This means your Zoho refresh token might be expired.**

## 🔄 How to Get a New Zoho Refresh Token

### Option 1: Quick Fix (If you have access to Zoho API Console)

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Find your "USA Payments Partner Portal" app
3. Click on "Self Client" → "Generate Code"
4. Copy the new refresh token
5. Update in `backend/.env`:
   ```bash
   ZOHO_REFRESH_TOKEN=YOUR_NEW_REFRESH_TOKEN
   ```

### Option 2: Generate New Refresh Token (Detailed)

1. **Go to Zoho API Console**: https://api-console.zoho.com/
2. **Click on your app** (or create one if needed)
3. **Get the Authorization Code**:
   - Go to this URL (replace YOUR_CLIENT_ID):
   ```
   https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:3000/auth/callback
   ```
   
4. **Authorize** → You'll be redirected with a `code` parameter

5. **Exchange code for refresh token**:
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "code=YOUR_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3000/auth/callback" \
     -d "grant_type=authorization_code"
   ```

6. **Copy the `refresh_token`** from the response

7. **Update backend/.env**:
   ```bash
   ZOHO_REFRESH_TOKEN=your_new_refresh_token_here
   ```

## 🚀 Start Testing (Once Refresh Token is Updated)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 3001
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
ready - started server on 0.0.0.0:3000
```

### Terminal 3 - Test Zoho Connection
```bash
cd backend
npm run test:zoho:health
```

Expected output when working:
```
✅ Environment Variables: All required variables set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API
🎉 All health checks passed! Zoho CRM is ready.
```

## 🧪 Quick Test in Browser

1. **Open**: http://localhost:3000
2. **Login**: Use your test credentials
3. **Dashboard**: Should show lead statistics
4. **Create Lead**: Go to Leads → New Lead
5. **Verify**: Check Zoho CRM to see if the lead appears

## 🔍 Troubleshooting

### "Authentication failed"
- **Cause**: Refresh token expired
- **Fix**: Generate new refresh token (see above)

### "Connection refused"
- **Cause**: Backend not running
- **Fix**: Start backend with `cd backend && npm run dev`

### "Failed to fetch leads"
- **Cause**: Frontend can't reach backend
- **Fix**: Check backend is running on port 3001

### "Partner not found"
- **Cause**: No partner record with zoho_partner_id
- **Fix**: Create a partner via webhook or manually in Supabase

## 📝 Your Current Credentials

Based on what we found in your `.env` files:

**Zoho Client ID**: `1000.UOXBUB0B4LK17X5FB7BXUM26MR3UBP`
**Zoho Client Secret**: `5cf7b7a0596f8fb96148be1e957ead1d2496093ce8`
**Zoho Refresh Token**: `1000.93c80957ca5f0a78491190681990bc21.0196c13b859933dea6deef7af49d0d88`
*(This token appears to be expired - needs refresh)*

**Supabase URL**: `https://cvzadrvtncnjanoehzhj.supabase.co`
**Supabase Keys**: ✅ Already configured

## ✅ Next Steps

1. **Get new Zoho refresh token** (if current one is expired)
2. **Update `backend/.env`** with new token
3. **Run `npm run test:zoho:health`** to verify
4. **Start both servers**
5. **Test in browser**

## 📚 Full Documentation

- **`MANUAL_TESTING_GUIDE.md`** - Comprehensive testing guide
- **`ZOHO_INTEGRATION_SETUP.md`** - Detailed setup instructions
- **`ZOHO_INTEGRATION_COMPLETE.md`** - What was built

---

**Most likely issue**: Your Zoho refresh token expired. Get a new one from Zoho API Console and you'll be good to go!

