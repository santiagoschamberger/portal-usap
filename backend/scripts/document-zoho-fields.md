# Zoho CRM Deal Fields - Available in Your System

Based on the screenshot of your Zoho CRM Deals module, here are the fields currently available:

## Overview Section
- **Deal Name** - Single Line
- **Deal Owner** - User lookup
- **Merchant Name** - Lookup (MX of Sales Agent)
- **Contact Name** - Lookup (Support Specialist)
- **Contact Email** - Email
- **Stage** - Option 1+
- **Decline Reason** - Option 1+
- **Processor** - Option 1+
- **Sponsor Bank** - Option 1+
- **MID** - Single Line
- **Partner Payout Type** - Option 1+
- **Lender Message** - Multi Line
- **Connected To** - Multi Module Lookup

## Deal Details (Right Column)
- **Partner** - Lookup
- **Partner Contact** - Lookup
- **Additional Partner Co...** - Multi Line
- **Lead Source**
- **Campaign** - Single Line
- **Layout** - Long Integer
- **Modified By** - Single Line
- **Created By** - Single Line
- **Ready For Submission** - Date/Time
- **Approved Time Stamp** - Date/Time
- **Client Engagement C...** - User
- **Interested** - Date/Time
- **Lender File Upload** - File Upload

## DBA Information
- **Website** - URL
- **Websites Platform** - Option 1 + Option 2
- **Customer Service B...** - Phone
- **Customer Service E...** - Email
- **DBA Address Line 2** - Single Line
- **DBA City** - Single Line
- **DBA State** - Single Line
- **DBA Postal / Zip Code** - Single Line
- **DBA Country** - Single Line

## Processing Information
- **Describe Your Produc...** - Multi Line
- **Will You Do Processi...** - Single Line
- **Total Monthly Sales** - Currency
- **Average Sale Price** - Currency
- **Estimated Highest Sa...** - Currency
- **Are You Currently Pro...** - Single Line
- **Previous CC Account...** - Single Line
- **Business or Operatin...** - Single Line
- **Percentage of in Pers...** - Percent
- **Percentage of Online...** - Percent

## Bank Account Information
- **Bank Name** - Single Line
- **Bank Account Number** - Single Line
- **Bank Routing Number** - Single Line

## Pricing Structure
- **Structure** - Option 1+
- **Rate(s)** - Single Line
- **Transaction/Rate** - Option 1+
- **Per Authorization** - Single Line

## Approval Information
- **Approval Date** - Option 1+
- **Referred to** - Percent
- **Funding Delay** - Option 1+
- **MCG** - Single Line
- **Approval Months V...** - Currency
- **Approval High Ticke...** - Currency
- **Deployed By** - Option 1+
- **Delivery** - Option 1+
- **Delivery (P)** - Single Line
- **Terminal** - Single Line
- **Terminal Tracking Nu...** - Single Line
- **POS/Software** - Single Line
- **POS/Software Provisio...** - Single Line
- **PCI Complaint** - Option 1+

## ACH
- **ACH Processor** - Single Line
- **Max Monthly Volume** - Single Line
- **Max Check Amount** - Single Line

## Revenue
- **Probability (%)** - Number
- **Currency** - Option 1+
- **Amount** - Currency
- **Exchange Rate** - Decimal
- **Expected Revenue** - Currency

## Email Links
- **Processor Link** - Multi Line
- **Merchant Link** - Multi Line
- **Sales Rep/MX Link** - Multi Line

---

## Important Notes for Webhook Setup

### Fields We Need for Deal Webhooks:
Based on the available fields shown, the webhook should use:

1. **Partner** (Lookup field) - Already exists ✅
2. **Deal Owner** (User) - Already exists ✅
3. **Stage** (Option field) - Already exists ✅
4. **Deal Name** - Already exists ✅
5. **Amount** (Currency) - Already exists ✅
6. **Merchant Name** (Lookup) - Already exists ✅

### Custom Field for StrategicPartnerId
The screenshot doesn't show a **StrategicPartnerId** field, but you may already have it or you can:
- Use the existing **Partner** lookup field instead
- Or create **StrategicPartnerId** as a text field to store the portal user ID

### Next Steps
1. ✅ All standard fields needed for the webhook exist
2. ⚠️  **ZOHO_REFRESH_TOKEN needs to be refreshed** (current token is invalid/expired)
3. Decide if you want to add **StrategicPartnerId** or use existing **Partner** field
4. Configure webhook in Zoho Workflow Rules

### To Refresh Your Zoho Token:
1. Go to https://api-console.zoho.com/
2. Login with your Zoho account
3. Go to "Self Client" → Generate new tokens
4. Copy the new **refresh_token**
5. Update your `.env` file with the new `ZOHO_REFRESH_TOKEN`


