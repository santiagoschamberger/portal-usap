# Bug Fixes Documentation

This directory contains detailed documentation of bugs discovered and fixed in the portal.

## Critical Bugs Fixed

### Contact Webhook Bug
**File:** `CONTACT_WEBHOOK_BUG_FIX.md`
- **Issue:** Leads were being converted to sub-accounts
- **Cause:** Zoho auto-creates Contacts from Leads, triggering webhook
- **Fix:** Added email existence check before creating sub-account
- **Date:** October 27, 2025

### Deal Webhook Missing
**File:** `DEAL_WEBHOOK_FIX.md`
- **Issue:** Converted deals not appearing in portal
- **Cause:** Missing webhook for deal creation/updates
- **Fix:** Implemented `/api/webhooks/zoho/deal` endpoint
- **Date:** October 27, 2025

### Sub-Account Role Filtering
**File:** `SUB_ACCOUNT_FILTER_BUG.md`
- **Issue:** Sub-accounts seeing all partner data
- **Cause:** Role mismatch ('sub' vs 'sub_account')
- **Fix:** Updated code to check both role values
- **Date:** October 27, 2025

## Quick Reference
**File:** `QUICK_FIX_SUMMARY.md`

Consolidated summary of all fixes for quick reference.

