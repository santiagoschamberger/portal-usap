# How to Refresh Your Zoho CRM Access Token

## Problem
Your scripts are failing with this error:
```json
{
  "error": "invalid_code"
}
```

This means your **ZOHO_REFRESH_TOKEN** has expired or is invalid.

## Solution: Generate a New Refresh Token

### Step 1: Go to Zoho API Console
1. Visit: https://api-console.zoho.com/
2. Sign in with your Zoho CRM account credentials

### Step 2: Create or Use Self Client
1. Click on **"Self Client"** in the left sidebar
2. If you don't have one, click **"Create Now"**
3. Note your **Client ID** and **Client Secret** (you should already have these in your `.env` file)

### Step 3: Generate Access Token
1. Click on **"Generate Code"** tab
2. Select the following scopes:
   ```
   ZohoCRM.modules.ALL
   ZohoCRM.settings.ALL
   ZohoCRM.users.READ
   ```
3. Set **Time Duration**: Choose a long duration (like 10 minutes) to give yourself time
4. Click **"Create"**
5. Copy the **Code** that appears (this is temporary!)

### Step 4: Generate Refresh Token
1. Click on the **"Generate Token"** tab
2. Paste the code you just copied into the **"Code"** field
3. Click **"Generate"**
4. You'll see a JSON response with both:
   - `access_token` (expires in 1 hour - don't use this)
   - **`refresh_token`** ← THIS IS WHAT YOU NEED!

### Step 5: Update Your .env File
1. Open `/Users/santiago/Desktop/DEV/USA Payments/usapayments-portal-2.0/.env`
2. Find the line with `ZOHO_REFRESH_TOKEN=`
3. Replace the old token with your new **refresh_token**
4. Save the file

Your `.env` should have:
```bash
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_new_refresh_token_here  ← Update this!
```

### Step 6: Test the Scripts Again
Now you can run the scripts:

```bash
# Audit existing fields
npx ts-node backend/scripts/audit-zoho-deal-fields.ts

# Setup custom fields (if needed)
npx ts-node backend/scripts/setup-zoho-deal-fields.ts
```

## Important Notes

- **Refresh tokens don't expire** unless you revoke them or generate a new one
- Keep your refresh token secure - treat it like a password
- The access token generated from the refresh token expires every hour, but our scripts automatically generate new ones as needed
- If you see "invalid_code" again in the future, repeat these steps

## What the Scripts Will Do (After Token Refresh)

1. **audit-zoho-deal-fields.ts**
   - Lists all fields currently in your Deals module
   - Shows which required fields exist
   - Identifies any missing custom fields

2. **setup-zoho-deal-fields.ts**
   - Creates **StrategicPartnerId** field (only if it doesn't exist)
   - This field links deals to portal users who created the original lead
   - All other required fields already exist in your system!

## Need Help?
If you continue to see errors after refreshing the token, check:
1. ✅ Client ID and Client Secret are correct
2. ✅ Refresh token was copied completely (no extra spaces)
3. ✅ You have the correct API scopes enabled
4. ✅ Your Zoho CRM account has API access enabled


