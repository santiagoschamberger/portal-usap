# Zoho CRM Deal Field Setup Scripts

## 📋 Overview

These scripts help you set up and verify the custom fields needed for the deal webhook integration between your Partner Portal and Zoho CRM.

## 🔧 Available Scripts

### 1. `audit-zoho-deal-fields.ts` - Check What You Have
**Purpose**: Audits your existing Zoho CRM Deals module to see what fields are already there.

**Usage**:
```bash
npx ts-node backend/scripts/audit-zoho-deal-fields.ts
```

**What it does**:
- ✅ Lists all fields in your Deals module
- ✅ Checks for required standard fields
- ✅ Identifies missing custom fields
- ✅ Shows which fields are custom vs standard

**Run this first** to understand your current setup!

---

### 2. `setup-zoho-deal-fields.ts` - Create Missing Fields
**Purpose**: Creates any custom fields that don't exist yet in your Deals module.

**Usage**:
```bash
npx ts-node backend/scripts/setup-zoho-deal-fields.ts
```

**What it creates**:
- **StrategicPartnerId** (Text field, 50 chars) - Links deal to the portal user who created the lead

**What it checks**:
- All standard fields you need (Partner, Deal_Name, Stage, Amount, Owner)

**Note**: Based on your Zoho screenshot, you already have most fields! This only creates what's missing.

---

### 3. `document-zoho-fields.md` - Field Reference
**Purpose**: Documents all the fields visible in your Zoho CRM Deals module (from your screenshot).

**Contains**:
- Complete list of available fields organized by section
- Field types (Single Line, Lookup, Currency, etc.)
- Notes on which fields the webhook will use

---

### 4. `ZOHO_TOKEN_REFRESH_GUIDE.md` - Fix Token Issues
**Purpose**: Step-by-step guide to refresh your Zoho API tokens when they expire.

**Use when you see**:
```json
{
  "error": "invalid_code"
}
```

This means your `ZOHO_REFRESH_TOKEN` needs to be refreshed!

---

## 🚨 Current Issue: Token Expired

Your scripts are currently failing because the **ZOHO_REFRESH_TOKEN is invalid/expired**.

### Quick Fix:
1. Follow the guide in `ZOHO_TOKEN_REFRESH_GUIDE.md`
2. Go to https://api-console.zoho.com/
3. Generate a new refresh token
4. Update your `.env` file
5. Run the scripts again

---

## 📦 Required Fields for Webhook

Based on your Zoho CRM setup, these fields are **already available**:

| Field | Type | Status | Used In Webhook |
|-------|------|--------|-----------------|
| Partner | Lookup | ✅ Exists | Yes - Partner reference |
| Deal Name | Single Line | ✅ Exists | Yes - Deal identification |
| Deal Owner | User | ✅ Exists | Yes - Ownership tracking |
| Stage | Option List | ✅ Exists | Yes - Status updates |
| Amount | Currency | ✅ Exists | Yes - Deal value |
| Merchant Name | Lookup | ✅ Exists | Optional |
| Contact Name | Lookup | ✅ Exists | Optional |

**To be created** (if it doesn't exist):
| Field | Type | Status | Used In Webhook |
|-------|------|--------|-----------------|
| StrategicPartnerId | Text (50) | ⚠️ To create | Yes - Portal user ID |

---

## 🎯 Workflow

### For First-Time Setup:
```bash
# Step 1: Refresh your Zoho token (follow ZOHO_TOKEN_REFRESH_GUIDE.md)

# Step 2: Audit what you have
npx ts-node backend/scripts/audit-zoho-deal-fields.ts

# Step 3: Create any missing fields
npx ts-node backend/scripts/setup-zoho-deal-fields.ts

# Step 4: Verify everything was created
npx ts-node backend/scripts/audit-zoho-deal-fields.ts
```

### After Setup:
1. Configure the webhook in Zoho Workflow Rules
2. Use the JSON payload from your webhook documentation
3. Test with a deal creation/update

---

## 🔐 Environment Variables Required

Make sure your `.env` file (in project root) contains:
```bash
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
```

---

## 📖 Additional Resources

- **Zoho API Console**: https://api-console.zoho.com/
- **Zoho CRM API Docs**: https://www.zoho.com/crm/developer/docs/api/v3/
- **Field Types Reference**: https://www.zoho.com/crm/developer/docs/api/v3/field-types.html

---

## ⚠️ Important Notes

1. **Don't break existing setup**: These scripts only ADD fields, they don't modify or delete existing ones
2. **Token security**: Keep your refresh token secure - it doesn't expire unless revoked
3. **Rate limiting**: Scripts include 1-second delays between field creation to avoid Zoho rate limits
4. **Backup**: Always good to export your Deals module data before making schema changes

---

## 🐛 Troubleshooting

### Error: "invalid_code"
→ Your refresh token expired. See `ZOHO_TOKEN_REFRESH_GUIDE.md`

### Error: "INVALID_TOKEN"
→ Access token issue. The script generates this automatically, so check your refresh token.

### Error: "Missing required environment variables"
→ Check your `.env` file has all three variables (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)

### Error: Rate limit exceeded
→ Zoho has API limits. Wait a few minutes and try again.

### Fields already exist
→ This is normal! The scripts will skip creating fields that already exist.

---

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Verify your `.env` file is correct
3. Make sure your Zoho account has API access enabled
4. Check Zoho CRM permissions for your API user


