# Status & Stage Mapping Reference

**Quick Reference Guide for Portal ↔ Zoho CRM Mappings**  
**Last Updated:** November 14, 2025

---

## 📋 Lead Status Mapping

### Portal Display → Zoho CRM (6 Statuses)

| # | Portal Display | Zoho CRM Status | Notes |
|---|---------------|-----------------|-------|
| 1 | Pre-Vet / New Lead | Lead | Default for new leads |
| 2 | Contacted | Contacted | - |
| 3 | Sent for Signature / Submitted | Application Submitted | - |
| 4 | Approved | Approved | Opposite of Declined |
| 5 | Declined | Declined | Opposite of Approved |
| 6 | Dead / Withdrawn | Lost | Final status |

### Bidirectional Mapping Logic

**Portal → Zoho (Outbound):**
```javascript
const portalToZoho = {
  'Pre-Vet / New Lead': 'Lead',
  'Contacted': 'Contacted',
  'Sent for Signature / Submitted': 'Application Submitted',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Dead / Withdrawn': 'Lost'
};
```

**Zoho → Portal (Inbound):**
```javascript
const zohoToPortal = {
  'Lead': 'Pre-Vet / New Lead',
  'Contacted': 'Contacted',
  'Application Submitted': 'Sent for Signature / Submitted',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Lost': 'Dead / Withdrawn'
};
```

### Status Badge Colors

```javascript
const statusColors = {
  'Pre-Vet / New Lead': 'blue',      // New/pending
  'Contacted': 'purple',              // In progress
  'Sent for Signature / Submitted': 'yellow', // Waiting
  'Approved': 'green',                // Success
  'Declined': 'red',                  // Rejected
  'Dead / Withdrawn': 'gray'          // Closed
};
```

---

## 💼 Deal Stage Mapping

### Portal Display → Zoho CRM (5 Stages → 13 Stages)

| # | Portal Display | Zoho CRM Stages | Notes |
|---|---------------|-----------------|-------|
| 1 | **New Lead / Prevet** | • New Deal<br>• Pre-Vet | Initial stages |
| 2 | **Submitted** | • Sent for Signature<br>• Signed Application | Application submitted |
| 3 | **Underwriting** | • Sent to Underwriting<br>• App Pended | Under review |
| 4 | **Approved / Declined** | • Approved<br>• Declined<br>• Conditionally Approved | Decision made (show one or the other) |
| 5 | **Closed** | • Approved - Closed<br>• Dead / Do Not Contact<br>• Merchant Unresponsive<br>• App Withdrawn | Final stages |

### Complete Zoho → Portal Mapping

```javascript
const zohoStageToPortal = {
  // New Lead / Prevet
  'New Deal': 'New Lead / Prevet',
  'Pre-Vet': 'New Lead / Prevet',
  
  // Submitted
  'Sent for Signature': 'Submitted',
  'Signed Application': 'Submitted',
  
  // Underwriting
  'Sent to Underwriting': 'Underwriting',
  'App Pended': 'Underwriting',
  
  // Approved
  'Approved': 'Approved',
  'Conditionally Approved': 'Approved',
  
  // Declined
  'Declined': 'Declined',
  
  // Closed
  'Approved - Closed': 'Closed',
  'Dead / Do Not Contact': 'Closed',
  'Merchant Unresponsive': 'Closed',
  'App Withdrawn': 'Closed'
};
```

### Stage Badge Colors

```javascript
const stageColors = {
  'New Lead / Prevet': 'blue',       // New
  'Submitted': 'purple',             // In progress
  'Underwriting': 'yellow',          // Under review
  'Approved': 'green',               // Success
  'Declined': 'red',                 // Rejected
  'Closed': 'gray'                   // Final
};
```

### Stage Icons (Optional)

```javascript
const stageIcons = {
  'New Lead / Prevet': '📋',
  'Submitted': '📝',
  'Underwriting': '🔍',
  'Approved': '✅',
  'Declined': '❌',
  'Closed': '🔒'
};
```

---

## 🔄 Mapping Implementation Examples

### Backend: Status Mapping Service

```typescript
// backend/src/services/statusMappingService.ts

export class StatusMappingService {
  private static portalToZoho: Record<string, string> = {
    'Pre-Vet / New Lead': 'Lead',
    'Contacted': 'Contacted',
    'Sent for Signature / Submitted': 'Application Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Dead / Withdrawn': 'Lost'
  };

  private static zohoToPortal: Record<string, string> = {
    'Lead': 'Pre-Vet / New Lead',
    'Contacted': 'Contacted',
    'Application Submitted': 'Sent for Signature / Submitted',
    'Approved': 'Approved',
    'Declined': 'Declined',
    'Lost': 'Dead / Withdrawn'
  };

  static mapToZoho(portalStatus: string): string {
    return this.portalToZoho[portalStatus] || portalStatus;
  }

  static mapFromZoho(zohoStatus: string): string {
    return this.zohoToPortal[zohoStatus] || zohoStatus;
  }

  static getAllPortalStatuses(): string[] {
    return Object.keys(this.portalToZoho);
  }
}
```

### Backend: Stage Mapping Service

```typescript
// backend/src/services/stageMappingService.ts

export class StageMappingService {
  private static zohoToPortal: Record<string, string> = {
    'New Deal': 'New Lead / Prevet',
    'Pre-Vet': 'New Lead / Prevet',
    'Sent for Signature': 'Submitted',
    'Signed Application': 'Submitted',
    'Sent to Underwriting': 'Underwriting',
    'App Pended': 'Underwriting',
    'Approved': 'Approved',
    'Conditionally Approved': 'Approved',
    'Declined': 'Declined',
    'Approved - Closed': 'Closed',
    'Dead / Do Not Contact': 'Closed',
    'Merchant Unresponsive': 'Closed',
    'App Withdrawn': 'Closed'
  };

  static mapFromZoho(zohoStage: string): string {
    return this.zohoToPortal[zohoStage] || zohoStage;
  }

  static getAllPortalStages(): string[] {
    return [
      'New Lead / Prevet',
      'Submitted',
      'Underwriting',
      'Approved',
      'Declined',
      'Closed'
    ];
  }

  static getStageCategory(portalStage: string): string {
    const categories: Record<string, string> = {
      'New Lead / Prevet': 'new',
      'Submitted': 'in_progress',
      'Underwriting': 'review',
      'Approved': 'success',
      'Declined': 'rejected',
      'Closed': 'final'
    };
    return categories[portalStage] || 'unknown';
  }
}
```

### Frontend: Status Badge Component

```typescript
// frontend/src/components/leads/LeadStatusBadge.tsx

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadStatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClasses = {
    'Pre-Vet / New Lead': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-purple-100 text-purple-800',
    'Sent for Signature / Submitted': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Declined': 'bg-red-100 text-red-800',
    'Dead / Withdrawn': 'bg-gray-100 text-gray-800'
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

### Frontend: Stage Badge Component

```typescript
// frontend/src/components/deals/DealStageBadge.tsx

interface StageBadgeProps {
  stage: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DealStageBadge({ stage, size = 'md' }: StageBadgeProps) {
  const colorClasses = {
    'New Lead / Prevet': 'bg-blue-100 text-blue-800',
    'Submitted': 'bg-purple-100 text-purple-800',
    'Underwriting': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Declined': 'bg-red-100 text-red-800',
    'Closed': 'bg-gray-100 text-gray-800'
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
-- Migrate existing leads to new status format
UPDATE leads 
SET 
  status = CASE 
    WHEN status = 'Lead' THEN 'Pre-Vet / New Lead'
    WHEN status = 'Contacted' THEN 'Contacted'
    WHEN status = 'Application Submitted' THEN 'Sent for Signature / Submitted'
    WHEN status = 'Approved' THEN 'Approved'
    WHEN status = 'Declined' THEN 'Declined'
    WHEN status = 'Lost' THEN 'Dead / Withdrawn'
    ELSE status
  END,
  zoho_status = status -- Preserve original Zoho status
WHERE status IN ('Lead', 'Contacted', 'Application Submitted', 'Approved', 'Declined', 'Lost');
```

### Migrate Existing Deal Stages

```sql
-- Migrate existing deals to new stage format
UPDATE deals 
SET 
  stage = CASE 
    WHEN stage IN ('New Deal', 'Pre-Vet') THEN 'New Lead / Prevet'
    WHEN stage IN ('Sent for Signature', 'Signed Application') THEN 'Submitted'
    WHEN stage IN ('Sent to Underwriting', 'App Pended') THEN 'Underwriting'
    WHEN stage IN ('Approved', 'Conditionally Approved') THEN 'Approved'
    WHEN stage = 'Declined' THEN 'Declined'
    WHEN stage IN ('Approved - Closed', 'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn') THEN 'Closed'
    ELSE stage
  END,
  zoho_stage = stage -- Preserve original Zoho stage
WHERE stage IN (
  'New Deal', 'Pre-Vet', 'Sent for Signature', 'Signed Application',
  'Sent to Underwriting', 'App Pended', 'Approved', 'Conditionally Approved',
  'Declined', 'Approved - Closed', 'Dead / Do Not Contact', 
  'Merchant Unresponsive', 'App Withdrawn'
);
```

---

## 🧪 Testing Scenarios

### Lead Status Testing

1. **Portal → Zoho:**
   - Create lead with "Pre-Vet / New Lead" → Verify "Lead" in Zoho
   - Update to "Contacted" → Verify "Contacted" in Zoho
   - Update to "Approved" → Verify "Approved" in Zoho

2. **Zoho → Portal:**
   - Update lead in Zoho to "Lead" → Verify "Pre-Vet / New Lead" in Portal
   - Update to "Application Submitted" → Verify "Sent for Signature / Submitted" in Portal
   - Update to "Lost" → Verify "Dead / Withdrawn" in Portal

### Deal Stage Testing

1. **Zoho → Portal:**
   - Create deal in Zoho with "New Deal" → Verify "New Lead / Prevet" in Portal
   - Update to "Sent for Signature" → Verify "Submitted" in Portal
   - Update to "Approved" → Verify "Approved" in Portal
   - Update to "Approved - Closed" → Verify "Closed" in Portal

2. **Edge Cases:**
   - Deal with "Conditionally Approved" → Should show "Approved"
   - Deal with "App Pended" → Should show "Underwriting"
   - Deal with "Merchant Unresponsive" → Should show "Closed"

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

**Quick Links:**
- [Enhancement Plan](./PORTAL_ENHANCEMENT_PLAN.md)
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md)
- [Project Structure](../PROJECT_STRUCTURE.md)

**Last Updated:** November 14, 2025  
**Status:** Reference Document




