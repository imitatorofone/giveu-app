-- Auto-approve all users for beta testing
-- This script updates all existing profiles with 'pending' approval_status to 'approved'

UPDATE profiles 
SET approval_status = 'approved'
WHERE approval_status = 'pending';

-- Verify the update
SELECT 
  approval_status,
  COUNT(*) as count
FROM profiles 
GROUP BY approval_status;

-- Show all profiles with their approval status
SELECT 
  id,
  email,
  full_name,
  church_code,
  role,
  approval_status,
  created_at
FROM profiles 
ORDER BY created_at DESC;
