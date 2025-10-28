-- =====================================================
-- Database Verification Script for Single Record Requirements
-- =====================================================

-- Check 1: Verify only 1 record per lead in lead_status_history
-- This query should return NO ROWS if the requirement is met
SELECT 
    lead_id, 
    COUNT(*) as record_count,
    'VIOLATION: Multiple status records for single lead' as issue
FROM lead_status_history 
GROUP BY lead_id 
HAVING COUNT(*) > 1;

-- Check 2: Verify only 1 record per deal in deal_stage_history  
-- This query should return NO ROWS if the requirement is met
SELECT 
    deal_id, 
    COUNT(*) as record_count,
    'VIOLATION: Multiple stage records for single deal' as issue
FROM deal_stage_history 
GROUP BY deal_id 
HAVING COUNT(*) > 1;

-- Check 3: Show current lead status history (should be 1 record per lead)
SELECT 
    lsh.lead_id,
    l.first_name,
    l.last_name,
    l.company,
    lsh.old_status,
    lsh.new_status,
    lsh.created_at,
    'Current lead status record' as record_type
FROM lead_status_history lsh
JOIN leads l ON l.id = lsh.lead_id
ORDER BY lsh.created_at DESC;

-- Check 4: Show current deal stage history (should be 1 record per deal)
SELECT 
    dsh.deal_id,
    d.deal_name,
    d.first_name,
    d.last_name,
    d.company,
    dsh.old_stage,
    dsh.new_stage,
    dsh.created_at,
    'Current deal stage record' as record_type
FROM deal_stage_history dsh
JOIN deals d ON d.id = dsh.deal_id
ORDER BY dsh.created_at DESC;

-- Check 5: Look for leads that should have been converted to deals
-- This helps identify if lead deletion during conversion is working
SELECT 
    l.id as lead_id,
    l.first_name,
    l.last_name,
    l.company,
    l.status as lead_status,
    l.created_at as lead_created,
    d.id as deal_id,
    d.deal_name,
    d.stage as deal_stage,
    d.created_at as deal_created,
    CASE 
        WHEN d.id IS NOT NULL THEN 'POTENTIAL ISSUE: Lead exists with matching deal'
        ELSE 'OK: Lead without matching deal'
    END as conversion_status
FROM leads l
LEFT JOIN deals d ON (
    d.first_name = l.first_name 
    AND d.last_name = l.last_name 
    AND d.partner_id = l.partner_id
)
ORDER BY l.created_at DESC;

-- Check 6: Show activity log for conversions
SELECT 
    al.created_at,
    al.action,
    al.description,
    al.metadata->>'converted_from_lead_id' as converted_lead_id,
    al.metadata->>'zoho_deal_id' as zoho_deal_id,
    'Conversion activity' as log_type
FROM activity_log al
WHERE al.action = 'deal_created'
    AND al.metadata->>'converted_from_lead_id' IS NOT NULL
ORDER BY al.created_at DESC;

-- Summary Report
SELECT 
    'Lead Status History Records' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT lead_id) as unique_leads,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT lead_id) THEN '✅ PASS: 1 record per lead'
        ELSE '❌ FAIL: Multiple records per lead'
    END as status
FROM lead_status_history

UNION ALL

SELECT 
    'Deal Stage History Records' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT deal_id) as unique_deals,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT deal_id) THEN '✅ PASS: 1 record per deal'
        ELSE '❌ FAIL: Multiple records per deal'
    END as status
FROM deal_stage_history

UNION ALL

SELECT 
    'Active Leads' as table_name,
    COUNT(*) as total_records,
    NULL as unique_count,
    CONCAT(COUNT(*), ' leads currently in system') as status
FROM leads

UNION ALL

SELECT 
    'Active Deals' as table_name,
    COUNT(*) as total_records,
    NULL as unique_count,
    CONCAT(COUNT(*), ' deals currently in system') as status
FROM deals;
