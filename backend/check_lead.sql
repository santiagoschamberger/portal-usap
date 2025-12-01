-- Check the lead with the Zoho ID from the webhook
SELECT 
  id,
  partner_id,
  created_by,
  first_name,
  last_name,
  email,
  company,
  status,
  zoho_lead_id,
  zoho_sync_status,
  created_at
FROM leads
WHERE zoho_lead_id = '5577028000048552001'
   OR email LIKE '%test%'
ORDER BY created_at DESC
LIMIT 5;
