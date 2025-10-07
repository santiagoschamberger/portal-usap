# Sub-Accounts Setup Guide

## Overview

This document explains how the sub-accounts system works and how to set it up properly in both Zoho CRM and the Partner Portal.

## System Architecture

### How It Works

1. **Partner (Main Account)** - A Vendor record in Zoho CRM that represents a partner organization
2. **Contacts (Sub-Accounts)** - Contact records in Zoho CRM linked to a Partner/Vendor
3. **Automatic Sync** - When a contact is created in Zoho and linked to a partner, a webhook creates a sub-account in the portal
4. **Manual Sync** - Partners can manually sync all their Zoho contacts to create/update sub-accounts
5. **Lead Tracking** - Each sub-account's leads are tracked and displayed to the main partner account

---

## Zoho CRM Setup

### Prerequisites

In Zoho CRM, you need:
- **Vendors Module** - Where your partners are stored (already set up)
- **Contacts Module** - Where sub-accounts (partner contacts) are stored
- **Partner Lookup Field** - A custom field on Contacts that links to the Vendor

### Step 1: Add Partner Field to Contacts (if not already present)

1. Go to **Settings → Customization → Modules and Fields**
2. Select **Contacts** module
3. Click **New Field**
4. Create a **Lookup** field:
   - Label: `Partner`
   - API Name: `Partner` (Zoho will create as `Partner.id`)
   - Module: Link to **Vendors**
   - Make it visible and editable

### Step 2: Configure the Webhook

Your webhook is already configured at:
```
https://backend-production-67e9.up.railway.app/api/webhooks/zoho/contact
```

**Current Configuration (Module Parameters):**
- Parameter Name: `fullname` → Parameter Value: `Contact Name`
- Parameter Name: `email` → Parameter Value: `Email`
- Parameter Name: `parentid` → Parameter Value: `Partners Id` (from Partner module)
- Parameter Name: `partnerid` → Parameter Value: `Contact Id`

✅ **This configuration is correct!** The webhook handler now supports both module parameters and JSON body formats.

### Step 3: Link Contacts to Partners

When creating a contact in Zoho CRM:
1. Fill in the contact's information (name, email, etc.)
2. **Set the Partner field** to link the contact to their parent partner/vendor
3. Save the contact
4. The webhook will automatically fire and create a sub-account in the portal

---

## Backend Implementation

### API Endpoints

#### 1. List Sub-Accounts with Lead Stats
```
GET /api/partners/sub-accounts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "contact@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "sub_account",
      "is_active": true,
      "created_at": "2025-10-07T...",
      "lead_stats": {
        "total_leads": 15,
        "new_leads": 3,
        "contacted": 5,
        "qualified": 4,
        "proposal": 2,
        "closed_won": 1,
        "closed_lost": 0
      }
    }
  ],
  "total": 1
}
```

#### 2. Sync Contacts from Zoho
```
POST /api/partners/sync-contacts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Contacts synced successfully",
  "synced": 10,
  "created": 5,
  "updated": 5,
  "details": [
    {
      "contact_id": "zoho_id",
      "email": "contact@example.com",
      "status": "created",
      "user_id": "uuid"
    }
  ]
}
```

#### 3. Webhook Handler
```
POST /api/webhooks/zoho/contact
```

Accepts two formats:

**Format 1: Module Parameters (Current Setup)**
```
fullname: "John Doe"
email: "john@example.com"
parentid: "zoho_partner_id"
partnerid: "zoho_contact_id"
```

**Format 2: JSON Body (For Compatibility)**
```json
{
  "First_Name": "John",
  "Last_Name": "Doe",
  "Email": "john@example.com",
  "Vendor": {
    "id": "zoho_partner_id",
    "name": "Partner Name"
  },
  "id": "zoho_contact_id"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  partner_id UUID REFERENCES partners(id),
  role VARCHAR(50) CHECK (role IN ('admin', 'sub_account')),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- **Main partner** has `role = 'admin'`
- **Sub-accounts** have `role = 'sub_account'`
- Both share the same `partner_id`, creating the organization relationship

### Leads Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  created_by_user_id UUID REFERENCES users(id),
  -- ... other fields
);
```

- `partner_id` links to the partner organization
- `created_by_user_id` tracks which user (admin or sub-account) created the lead
- Partners can see all leads for their organization
- Lead stats are aggregated per sub-account

---

## Frontend Implementation (To Be Built)

### Sub-Accounts Page

Create a new page at `/frontend/src/app/dashboard/sub-accounts/page.tsx`:

**Features:**
- Display table of all sub-accounts with their names and emails
- Show lead statistics for each sub-account
- "Sync from Zoho" button to trigger manual sync
- Links to view detailed stats for each sub-account

**Sample Component Structure:**
```tsx
<div>
  <button onClick={syncContacts}>Sync from Zoho CRM</button>
  
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Total Leads</th>
        <th>New</th>
        <th>Qualified</th>
        <th>Closed Won</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {subAccounts.map(account => (
        <tr key={account.id}>
          <td>{account.first_name} {account.last_name}</td>
          <td>{account.email}</td>
          <td>{account.lead_stats.total_leads}</td>
          <td>{account.lead_stats.new_leads}</td>
          <td>{account.lead_stats.qualified}</td>
          <td>{account.lead_stats.closed_won}</td>
          <td>
            <Link href={`/dashboard/sub-accounts/${account.id}`}>
              View Details
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Testing the Setup

### 1. Test Webhook

In Zoho CRM:
1. Create a new Contact
2. Link it to a Partner (via the Partner lookup field)
3. Check the webhook logs in Zoho to see if it fired successfully
4. Check your backend logs for the webhook processing
5. Verify the sub-account was created in the portal database

### 2. Test Manual Sync

Using an API client (Postman/Insomnia):
1. Get an auth token by logging in as a partner
2. Call `POST /api/partners/sync-contacts` with the token
3. Check the response to see how many contacts were synced
4. Verify sub-accounts exist in the database

### 3. Test Lead Stats

1. Create leads in the portal as different sub-accounts
2. Call `GET /api/partners/sub-accounts` as the main partner
3. Verify lead counts are correct for each sub-account

---

## Troubleshooting

### Webhook Not Firing

**Problem:** Creating a contact in Zoho doesn't create a sub-account

**Solutions:**
1. Check Zoho webhook configuration is active
2. Verify the webhook URL is correct
3. Check Zoho webhook execution logs for errors
4. Ensure the contact has a Partner linked
5. Check backend logs for webhook reception

### Partner Not Found

**Problem:** Webhook fires but says "Parent partner not found in portal"

**Solutions:**
1. Verify the partner exists in the `partners` table
2. Check that `partners.zoho_partner_id` matches the Zoho Vendor ID
3. Ensure the partner is approved (`approved = true`)

### Duplicate Email

**Problem:** Webhook says "Sub-account already exists"

**Solutions:**
1. This is normal behavior - the system prevents duplicate emails
2. Check if the user already exists in the portal
3. If needed, delete the existing user first

### No Leads Showing

**Problem:** Sub-account has leads but stats show zero

**Solutions:**
1. Check that `leads.created_by_user_id` is set correctly
2. Verify the lead's `partner_id` matches the sub-account's `partner_id`
3. Check RLS policies aren't blocking the query

---

## Summary

✅ **What's Implemented:**
- Webhook handler supporting both module parameters and JSON
- API endpoint to list sub-accounts with lead statistics
- API endpoint to sync contacts from Zoho manually
- Database structure for sub-accounts
- Lead tracking per sub-account

🚧 **What's Needed:**
- Frontend page to display sub-accounts
- UI for manual sync button
- Sub-account detail pages
- Email notifications when sub-accounts are created

---

## Deployment

After making code changes:

```bash
# Backend
cd backend
npm run build
git add .
git commit -m "feat: implement sub-accounts with lead tracking"
git push

# Railway will auto-deploy
```

The webhook will work immediately after deployment since it's already configured in Zoho CRM.

