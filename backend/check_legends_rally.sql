-- Check if "Legends Rally" deal exists in the database
SELECT 
  id,
  deal_name,
  stage,
  zoho_deal_id,
  partner_id,
  created_by,
  created_at,
  updated_at,
  zoho_sync_status,
  last_sync_at
FROM deals
WHERE deal_name ILIKE '%Legends Rally%'
ORDER BY created_at DESC;

-- Also check all deals to see the full picture
SELECT 
  COUNT(*) as total_deals,
  COUNT(DISTINCT partner_id) as unique_partners,
  COUNT(CASE WHEN zoho_deal_id IS NULL THEN 1 END) as deals_without_zoho_id,
  COUNT(CASE WHEN partner_id IS NULL THEN 1 END) as deals_without_partner
FROM deals;

-- Check recent deals
SELECT 
  id,
  deal_name,
  stage,
  zoho_deal_id,
  partner_id,
  created_at
FROM deals
ORDER BY created_at DESC
LIMIT 10;

