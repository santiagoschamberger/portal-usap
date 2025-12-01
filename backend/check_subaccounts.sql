-- Check all users and their roles
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  partner_id,
  is_active,
  created_at
FROM users
ORDER BY created_at DESC;

-- Check partners
SELECT 
  id,
  name,
  email,
  zoho_partner_id,
  approved
FROM partners;
