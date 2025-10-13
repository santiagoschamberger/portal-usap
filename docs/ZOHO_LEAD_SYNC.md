# Zoho Lead Sync Feature

## Overview
The Zoho Lead Sync feature allows partners to synchronize their historical leads from Zoho CRM into the partner portal. This is especially useful when onboarding existing partners who already have leads in Zoho.

## How It Works

### Backend Implementation

#### 1. New Zoho Service Method
**File**: `backend/src/services/zohoService.ts`

Added `getLeadsByVendor(vendorId: string)` method that:
- Fetches all leads from Zoho CRM associated with a specific vendor/partner ID
- Uses the Zoho API search endpoint with vendor ID criteria
- Returns up to 200 leads per request

#### 2. Sync Endpoint
**Endpoint**: `POST /api/leads/sync`
**File**: `backend/src/routes/leads.ts`

This authenticated endpoint:
1. Retrieves the partner's Zoho vendor ID from the database
2. Fetches all leads from Zoho CRM for that vendor
3. For each lead:
   - Maps Zoho lead status to local status format
   - Checks if lead already exists (by `zoho_lead_id`)
   - Creates new lead or updates existing lead
   - Creates status history entry for new leads
4. Updates partner's `last_sync_at` timestamp
5. Logs the sync activity
6. Returns summary: total, created, updated, skipped counts

**Status Mapping**:
```typescript
{
  'New': 'new',
  'Contacted': 'contacted',
  'Qualified': 'qualified',
  'Proposal': 'proposal',
  'Negotiation': 'negotiation',
  'Closed Won': 'closed_won',
  'Closed Lost': 'closed_lost',
  'Nurture': 'nurture',
  'Unqualified': 'unqualified'
}
```

### Frontend Implementation

#### 1. Lead Service Method
**File**: `frontend/src/services/leadService.ts`

Added `syncLeadsFromZoho()` method that:
- Calls the `/api/leads/sync` endpoint
- Returns sync results with counts and details

#### 2. Zoho Service Integration
**File**: `frontend/src/services/zohoService.ts`

Exposed sync method as `zohoService.leads.syncFromZoho()`

#### 3. UI Component
**File**: `frontend/src/app/leads/page.tsx`

Added:
- "Sync from Zoho" button in the page header
- Loading state during sync operation
- Toast notifications for sync progress and results
- Automatic refresh of leads list after sync

## Usage

### For Partners

1. **Navigate to Leads Page**: Go to the Leads Management page in the portal
2. **Click "Sync from Zoho"**: Located in the top right, next to "Create New Lead"
3. **Wait for Sync**: A loading indicator shows sync progress
4. **View Results**: Toast notification shows how many leads were created, updated, or skipped
5. **Browse Leads**: The leads table automatically refreshes with synced data

### For Administrators

Partners can only sync leads that are associated with their Zoho vendor ID. The sync:
- Only affects the partner's own leads
- Preserves existing lead data (updates rather than overwrites)
- Creates status history for new leads
- Logs all sync activities for audit purposes

## Requirements

### Partner Requirements
- Partner must have a `zoho_partner_id` in the database
- Partner must be authenticated
- Partner must have leads in Zoho CRM with their vendor ID

### Technical Requirements
- Valid Zoho API credentials configured
- Partner record must exist in both portal and Zoho
- Database must have proper RLS policies for lead access

## Error Handling

The sync process handles various error scenarios:

1. **Partner Not Found**: Returns 404 if partner doesn't exist
2. **No Zoho Partner ID**: Returns 400 if partner isn't linked to Zoho
3. **No Leads Found**: Returns success with 0 counts
4. **Individual Lead Errors**: Logs error but continues processing other leads
5. **Missing Required Fields**: Skips lead and logs reason

## Data Flow

```
User clicks "Sync from Zoho"
    ↓
Frontend calls POST /api/leads/sync
    ↓
Backend fetches partner's zoho_partner_id
    ↓
Backend calls Zoho API to get leads by vendor ID
    ↓
For each lead:
    - Check if exists (by zoho_lead_id)
    - Create new or update existing
    - Map status from Zoho to local format
    - Create status history
    ↓
Update partner's last_sync_at
    ↓
Log activity
    ↓
Return summary to frontend
    ↓
Frontend shows toast notification
    ↓
Frontend refreshes leads list
```

## Future Enhancements

Potential improvements:
1. **Automatic Sync**: Schedule periodic syncs (e.g., daily)
2. **Selective Sync**: Allow filtering by date range or status
3. **Pagination**: Handle more than 200 leads
4. **Bidirectional Sync**: Update Zoho when portal leads change
5. **Conflict Resolution**: Handle cases where lead was modified in both systems
6. **Sync History**: Show previous sync operations and their results
7. **Webhook Integration**: Real-time sync when leads change in Zoho

## Testing

### Manual Testing Steps

1. **Setup**:
   - Create a partner account in the portal
   - Ensure partner has a valid `zoho_partner_id`
   - Create test leads in Zoho CRM with that vendor ID

2. **Test Sync**:
   - Log in as the partner
   - Navigate to Leads page
   - Click "Sync from Zoho"
   - Verify toast notification shows correct counts
   - Verify leads appear in the table

3. **Test Update**:
   - Modify a lead status in Zoho
   - Run sync again
   - Verify lead status is updated in portal

4. **Test Error Handling**:
   - Try syncing with a partner that has no `zoho_partner_id`
   - Verify appropriate error message

## Security Considerations

- Sync endpoint requires authentication
- Partners can only sync their own leads
- Uses `supabaseAdmin` to bypass RLS for write operations
- Validates partner ownership before syncing
- Logs all sync activities for audit trail

## Performance

- Fetches up to 200 leads per sync
- Processes leads sequentially to avoid rate limits
- Uses database transactions for data integrity
- Efficient status mapping with lookup object

## Troubleshooting

### Sync Button Doesn't Work
- Check browser console for errors
- Verify authentication token is valid
- Check network tab for API response

### No Leads Synced
- Verify partner has `zoho_partner_id` in database
- Check that leads in Zoho have the correct vendor ID
- Review backend logs for Zoho API errors

### Leads Not Appearing
- Check if leads were marked as "skipped" (missing required fields)
- Verify RLS policies allow partner to read their leads
- Check lead status mapping

### Duplicate Leads
- Should not happen - sync checks for existing `zoho_lead_id`
- If duplicates exist, check database constraints
- May need to run cleanup script

