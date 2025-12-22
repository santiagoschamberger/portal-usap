# Status & Stage Mapping Reference

**Quick Reference Guide for Portal ↔ Zoho CRM Mappings**  
**Last Updated:** December 22, 2025

---

## 📋 Lead Status Mapping

### Zoho CRM → Portal Display (Client Requirements)

| # | Zoho CRM Status | Portal Display | Notes |
|---|----------------|----------------|-------|
| 1 | New | New | Initial lead status |
| 2 | Contact Attempt 1 | Contact Attempt | - |
| 3 | Contact Attempt 2 | Contact Attempt | - |
| 4 | Contact Attempt 3 | Contact Attempt | - |
| 5 | Contact Attempt 4 | Contact Attempt | - |
| 6 | Contact Attempt 5 | Contact Attempt | - |
| 7 | Interested - Needs Follow Up | Contacted - In Progress | - |
| 8 | Sent Pre-App | Contacted - In Progress | - |
| 9 | Pre-App Received | Contacted - In Progress | - |
| 10 | Awaiting Signature - No Motion.io | Sent for Signature | - |
| 11 | Send to Motion.io | Sent for Signature | - |
| 12 | Signed Application | Application Signed | - |
| 13 | Notify Apps Team | Application Signed | - |
| 14 | Convert | Application Signed | Triggers conversion |
| 15 | Lost | Lost | Final status |
| 16 | Junk | (Hidden/Lost) | Filtered in UI |

### Mapping Logic (Inbound from Zoho)

**Zoho → Portal (Inbound Webhooks):**
```javascript
const zohoToPortal = {
  // New
  'New': 'New',
  
  // Contact Attempt (all variations)
  'Contact Attempt 1': 'Contact Attempt',
  'Contact Attempt 2': 'Contact Attempt',
  'Contact Attempt 3': 'Contact Attempt',
  'Contact Attempt 4': 'Contact Attempt',
  'Contact Attempt 5': 'Contact Attempt',
  
  // Contacted - In Progress
  'Interested - Needs Follow Up': 'Contacted - In Progress',
  'Sent Pre-App': 'Contacted - In Progress',
  'Pre-App Received': 'Contacted - In Progress',
  
  // Sent for Signature
  'Awaiting Signature - No Motion.io': 'Sent for Signature',
  'Send to Motion.io': 'Sent for Signature',
  
  // Application Signed
  'Signed Application': 'Application Signed',
  'Notify Apps Team': 'Application Signed',
  'Convert': 'Application Signed',
  
  // Lost
  'Lost': 'Lost',
  'Junk': 'Lost'
};
```

**Portal → Zoho (Outbound - if needed):**
```javascript
const portalToZoho = {
  'New': 'New',
  'Contact Attempt': 'Contact Attempt 1',
  'Contacted - In Progress': 'Interested - Needs Follow Up',
  'Sent for Signature': 'Send to Motion.io',
  'Application Signed': 'Signed Application',
  'Lost': 'Lost'
};
```

### Status Badge Colors

```javascript
const statusColors = {
  'New': 'blue',                      // New lead
  'Contact Attempt': 'purple',        // Being contacted
  'Contacted - In Progress': 'indigo', // In progress
  'Sent for Signature': 'yellow',     // Waiting for signature
  'Application Signed': 'green',      // Success
  'Lost': 'gray'                      // Closed/Lost
};
```

---

## 💼 Deal Stage Mapping

### Zoho CRM → Portal Display (Client Requirements)

| # | Zoho CRM Stage | Portal Display | Notes |
|---|---------------|----------------|-------|
| 1 | Sent to Underwriting | In Underwriting | Under review |
| 2 | App Pended | In Underwriting | Pending additional info |
| 3 | Conditionally Approved | Conditionally Approved | Conditional approval |
| 4 | Approved | Approved | Full approval |
| 5 | App Withdrawn | Lost | Withdrawn by merchant |
| 6 | Merchant Unresponsive | Lost | No response |
| 7 | Dead/Do Not contact | Lost | Dead lead |
| 8 | Declined | Declined | Application declined |
| 9 | Approved - Closed | Closed | Final closed state |

### Complete Zoho → Portal Mapping

```javascript
const zohoStageToPortal = {
  // In Underwriting
  'Sent to Underwriting': 'In Underwriting',
  'App Pended': 'In Underwriting',
  
  // Conditionally Approved (separate status)
  'Conditionally Approved': 'Conditionally Approved',
  
  // Approved
  'Approved': 'Approved',
  
  // Lost (all negative outcomes except Declined)
  'App Withdrawn': 'Lost',
  'Merchant Unresponsive': 'Lost',
  'Dead/Do Not contact': 'Lost',
  'Dead / Do Not Contact': 'Lost',
  
  // Declined (separate from Lost)
  'Declined': 'Declined',
  
  // Closed (final positive outcome)
  'Approved - Closed': 'Closed'
};
```

### Stage Badge Colors

```javascript
const stageColors = {
  'In Underwriting': 'yellow',           // Under review
  'Conditionally Approved': 'orange',    // Conditional
  'Approved': 'green',                   // Success
  'Lost': 'gray',                        // Lost/Withdrawn
  'Declined': 'red',                     // Rejected
  'Closed': 'blue'                       // Final/Closed
};
```

### Stage Icons (Optional)

```javascript
const stageIcons = {
  'In Underwriting': '🔍',
  'Conditionally Approved': '⚠️',
  'Approved': '✅',
  'Lost': '❌',
  'Declined': '🚫',
  'Closed': '🔒'
};
```

---

## 🔄 Mapping Implementation Examples

### Backend: Lead Status Mapping Service

```typescript
// backend/src/services/leadStatusMappingService.ts

export class LeadStatusMappingService {
  private static portalToZoho: Record<string, string> = {
    'New': 'New',
    'Contact Attempt': 'Contact Attempt 1',
    'Contacted - In Progress': 'Interested - Needs Follow Up',
    'Sent for Signature': 'Send to Motion.io',
    'Application Signed': 'Signed Application',
    'Lost': 'Lost'
  };

  private static zohoToPortal: Record<string, string> = {
    'New': 'New',
    'Contact Attempt 1': 'Contact Attempt',
    'Contact Attempt 2': 'Contact Attempt',
    'Contact Attempt 3': 'Contact Attempt',
    'Contact Attempt 4': 'Contact Attempt',
    'Contact Attempt 5': 'Contact Attempt',
    'Interested - Needs Follow Up': 'Contacted - In Progress',
    'Sent Pre-App': 'Contacted - In Progress',
    'Pre-App Received': 'Contacted - In Progress',
    'Awaiting Signature - No Motion.io': 'Sent for Signature',
    'Send to Motion.io': 'Sent for Signature',
    'Signed Application': 'Application Signed',
    'Notify Apps Team': 'Application Signed',
    'Convert': 'Application Signed',
    'Lost': 'Lost',
    'Junk': 'Lost'
  };

  static mapToZoho(portalStatus: string): string {
    return this.portalToZoho[portalStatus] || 'New';
  }

  static mapFromZoho(zohoStatus: string): string {
    return this.zohoToPortal[zohoStatus] || 'New';
  }

  static getAllPortalStatuses(): string[] {
    return Object.keys(this.portalToZoho);
  }
  
  static isConvertedStatus(zohoStatus: string): boolean {
    return zohoStatus === 'Converted' || zohoStatus === 'Convert';
  }
}
```

### Backend: Stage Mapping Service

```typescript
// backend/src/services/stageMappingService.ts

export class StageMappingService {
  private static zohoToPortal: Record<string, string> = {
    'Sent to Underwriting': 'In Underwriting',
    'App Pended': 'In Underwriting',
    'Conditionally Approved': 'Conditionally Approved',
    'Approved': 'Approved',
    'App Withdrawn': 'Lost',
    'Merchant Unresponsive': 'Lost',
    'Dead/Do Not contact': 'Lost',
    'Dead / Do Not Contact': 'Lost',
    'Declined': 'Declined',
    'Approved - Closed': 'Closed'
  };

  static mapFromZoho(zohoStage: string): string {
    return this.zohoToPortal[zohoStage] || 'In Underwriting';
  }

  static getAllPortalStages(): string[] {
    return [
      'In Underwriting',
      'Conditionally Approved',
      'Approved',
      'Lost',
      'Declined',
      'Closed'
    ];
  }

  static getStageCategory(portalStage: string): string {
    const categories: Record<string, string> = {
      'In Underwriting': 'review',
      'Conditionally Approved': 'conditional',
      'Approved': 'success',
      'Lost': 'closed',
      'Declined': 'rejected',
      'Closed': 'final'
    };
    return categories[portalStage] || 'unknown';
  }
}
```

### Frontend: Lead Status Badge Component

```typescript
// frontend/src/components/leads/LeadStatusBadge.tsx

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadStatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClasses = {
    'New': 'bg-blue-100 text-blue-800',
    'Contact Attempt': 'bg-purple-100 text-purple-800',
    'Contacted - In Progress': 'bg-indigo-100 text-indigo-800',
    'Sent for Signature': 'bg-yellow-100 text-yellow-800',
    'Application Signed': 'bg-green-100 text-green-800',
    'Lost': 'bg-gray-100 text-gray-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${colorClasses[status] || 'bg-gray-100 text-gray-800'}
      ${sizeClasses[size]}
    `}>
      {status}
    </span>
  );
}
```

### Frontend: Deal Stage Badge Component

```typescript
// frontend/src/components/deals/DealStageBadge.tsx

interface StageBadgeProps {
  stage: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DealStageBadge({ stage, size = 'md' }: StageBadgeProps) {
  const colorClasses = {
    'In Underwriting': 'bg-yellow-100 text-yellow-800',
    'Conditionally Approved': 'bg-orange-100 text-orange-800',
    'Approved': 'bg-green-100 text-green-800',
    'Lost': 'bg-gray-100 text-gray-800',
    'Declined': 'bg-red-100 text-red-800',
    'Closed': 'bg-blue-100 text-blue-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${colorClasses[stage] || 'bg-gray-100 text-gray-800'}
      ${sizeClasses[size]}
    `}>
      {stage}
    </span>
  );
}
```

---

## 🔍 Webhook Implementation Examples

### Lead Status Webhook

```typescript
// backend/src/routes/webhooks.ts

router.post('/zoho/lead-status', async (req, res) => {
  try {
    const { lead_id, status } = req.body;
    
    // Map Zoho status to Portal display
    const portalStatus = StatusMappingService.mapFromZoho(status);
    
    // Update lead in database
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: portalStatus,
        zoho_status: status, // Store original Zoho status
        updated_at: new Date().toISOString()
      })
      .eq('zoho_lead_id', lead_id);
    
    if (error) throw error;
    
    // Create status history record
    await supabase.from('lead_status_history').insert({
      lead_id: data[0].id,
      old_status: data[0].status,
      new_status: portalStatus,
      changed_by: 'zoho_webhook',
      changed_at: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Lead status webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

### Deal Stage Webhook

```typescript
// backend/src/routes/webhooks.ts

router.post('/zoho/deal', async (req, res) => {
  try {
    const { deal_id, stage, approval_date } = req.body;
    
    // Map Zoho stage to Portal display
    const portalStage = StageMappingService.mapFromZoho(stage);
    
    // Update deal in database
    const { data, error } = await supabase
      .from('deals')
      .update({
        stage: portalStage,
        zoho_stage: stage, // Store original Zoho stage
        approval_date: approval_date,
        updated_at: new Date().toISOString()
      })
      .eq('zoho_deal_id', deal_id);
    
    if (error) throw error;
    
    // Create stage history record
    await supabase.from('deal_stage_history').insert({
      deal_id: data[0].id,
      old_stage: data[0].stage,
      new_stage: portalStage,
      changed_by: 'zoho_webhook',
      changed_at: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Deal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

---

## 📊 Data Migration Scripts

### Migrate Existing Lead Statuses

```sql
-- Migrate existing leads to new status format (December 2025 requirements)
-- IMPORTANT: Run this migration to update all existing lead statuses
UPDATE leads 
SET 
  status = CASE 
    -- Old mappings to new mappings
    WHEN status = 'Pre-Vet / New Lead' OR status = 'Lead' THEN 'New'
    WHEN status = 'Contacted' THEN 'Contact Attempt'
    WHEN status = 'Sent for Signature / Submitted' OR status = 'Application Submitted' THEN 'Sent for Signature'
    WHEN status = 'Approved' THEN 'Application Signed'
    WHEN status = 'Declined' THEN 'Lost'
    WHEN status = 'Dead / Withdrawn' OR status = 'Lost' THEN 'Lost'
    -- New statuses (if already using new format, keep as is)
    WHEN status IN ('New', 'Contact Attempt', 'Contacted - In Progress', 'Sent for Signature', 'Application Signed', 'Lost') THEN status
    ELSE 'New' -- Default fallback
  END,
  updated_at = NOW()
WHERE status IS NOT NULL;

-- Verify migration
SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;
```

### Migrate Existing Deal Stages

```sql
-- Migrate existing deals to new stage format (December 2025 requirements)
-- IMPORTANT: Run this migration to update all existing deal stages
UPDATE deals 
SET 
  stage = CASE 
    -- Old mappings to new mappings
    WHEN stage IN ('New Lead / Prevet', 'New Deal', 'Pre-Vet', 'Submitted', 'Underwriting') THEN 'In Underwriting'
    WHEN stage = 'Conditionally Approved' THEN 'Conditionally Approved'
    WHEN stage = 'Approved' THEN 'Approved'
    WHEN stage IN ('Dead / Withdrawn', 'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn') THEN 'Lost'
    WHEN stage = 'Declined' THEN 'Declined'
    WHEN stage IN ('Closed', 'Approved - Closed') THEN 'Closed'
    -- New stages (if already using new format, keep as is)
    WHEN stage IN ('In Underwriting', 'Conditionally Approved', 'Approved', 'Lost', 'Declined', 'Closed') THEN stage
    ELSE 'In Underwriting' -- Default fallback
  END,
  updated_at = NOW()
WHERE stage IS NOT NULL;

-- Verify migration
SELECT stage, COUNT(*) as count 
FROM deals 
GROUP BY stage 
ORDER BY count DESC;
```

### Migration Checklist

Before running migrations:
- [ ] Backup database
- [ ] Review current status/stage values: `SELECT DISTINCT status FROM leads;`
- [ ] Review current stage values: `SELECT DISTINCT stage FROM deals;`
- [ ] Test migration on development/staging first

After running migrations:
- [ ] Verify all statuses mapped correctly
- [ ] Check for any NULL or unexpected values
- [ ] Test webhook processing with new mappings
- [ ] Update frontend UI to display new status/stage names
- [ ] Deploy updated backend code with new mapping services

---

## 🧪 Testing Scenarios

### Lead Status Testing (December 2025 Requirements)

1. **Zoho → Portal (Primary Flow):**
   - Update lead in Zoho to "New" → Verify "New" in Portal
   - Update to "Contact Attempt 1" → Verify "Contact Attempt" in Portal
   - Update to "Contact Attempt 3" → Verify "Contact Attempt" in Portal
   - Update to "Interested - Needs Follow Up" → Verify "Contacted - In Progress" in Portal
   - Update to "Sent Pre-App" → Verify "Contacted - In Progress" in Portal
   - Update to "Send to Motion.io" → Verify "Sent for Signature" in Portal
   - Update to "Signed Application" → Verify "Application Signed" in Portal
   - Update to "Convert" → Verify lead is removed (converted to deal)
   - Update to "Lost" → Verify "Lost" in Portal

2. **Edge Cases:**
   - Lead with "Junk" status → Should show "Lost" in Portal
   - Lead with "Contact Attempt 5" → Should show "Contact Attempt" in Portal
   - Lead with "Pre-App Received" → Should show "Contacted - In Progress" in Portal

### Deal Stage Testing (December 2025 Requirements)

1. **Zoho → Portal (Primary Flow):**
   - Create deal in Zoho with "Sent to Underwriting" → Verify "In Underwriting" in Portal
   - Update to "App Pended" → Verify "In Underwriting" in Portal
   - Update to "Conditionally Approved" → Verify "Conditionally Approved" in Portal
   - Update to "Approved" → Verify "Approved" in Portal
   - Update to "Approved - Closed" → Verify "Closed" in Portal

2. **Negative Outcome Testing:**
   - Deal with "App Withdrawn" → Should show "Lost"
   - Deal with "Merchant Unresponsive" → Should show "Lost"
   - Deal with "Dead/Do Not contact" → Should show "Lost"
   - Deal with "Declined" → Should show "Declined" (separate from Lost)

3. **Lead Conversion Testing:**
   - Create lead → Update to "Convert" → Verify deal created AND lead removed
   - Verify deal shows correct stage after conversion
   - Verify lead status history is cleaned up

---

## 📝 Notes

### Important Considerations

1. **Always Store Both Values:**
   - Store Portal display value in main `status`/`stage` field
   - Store original Zoho value in `zoho_status`/`zoho_stage` field
   - This allows for debugging and future mapping changes

2. **Handle Unknown Values:**
   - If Zoho sends unknown status/stage, store as-is
   - Log warning for investigation
   - Don't break the sync process

3. **Case Sensitivity:**
   - Zoho field values are case-sensitive
   - Always use exact casing in mappings
   - Consider normalizing before mapping

4. **Testing:**
   - Test all 6 lead statuses bidirectionally
   - Test all 13 deal stages from Zoho
   - Test status/stage history preservation
   - Test UI display for all values

---

## 📝 Implementation Summary

### What Changed (December 2025)

**Lead Statuses:**
- Simplified from 6 portal statuses to 6 new statuses
- More granular mapping from Zoho (16 Zoho statuses → 6 Portal statuses)
- Clear progression: New → Contact Attempt → Contacted - In Progress → Sent for Signature → Application Signed → Lost

**Deal Stages:**
- Reduced from 6 portal stages to 6 new stages
- Separated "Conditionally Approved" from "Approved"
- Separated "Lost" from "Declined" for better tracking
- Clear progression: In Underwriting → Conditionally Approved → Approved → Closed

### Migration Steps

1. **Update Backend Services** ✅
   - Updated `leadStatusMappingService.ts`
   - Updated `stageMappingService.ts`

2. **Run Database Migrations** (Next Step)
   - Backup database first
   - Run lead status migration SQL
   - Run deal stage migration SQL
   - Verify results

3. **Update Frontend Components** (After Migration)
   - Update status badge colors
   - Update stage badge colors
   - Update filter dropdowns
   - Update status/stage displays

4. **Test Webhooks** (After Deployment)
   - Test all lead status webhooks
   - Test all deal stage webhooks
   - Verify lead conversion flow

---

**Quick Links:**
- [Enhancement Plan](../PORTAL_ENHANCEMENT_PLAN.md)
- [Implementation Checklist](../IMPLEMENTATION_CHECKLIST.md)
- [Project Structure](../PROJECT_STRUCTURE.md)

**Last Updated:** December 22, 2025  
**Status:** ✅ Backend Updated | ⏳ Migration Pending | ⏳ Frontend Pending




