-- Check lead status constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass 
  AND contype = 'c';

-- Check deal stage constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'deals'::regclass 
  AND contype = 'c';
