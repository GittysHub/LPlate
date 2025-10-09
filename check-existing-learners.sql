-- Check existing learner accounts in your database
-- Run this query to see what learner profiles you have:

SELECT 
  p.id, 
  p.name, 
  p.role,
  p.postcode,
  p.email,
  p.created_at
FROM profiles p
WHERE p.role = 'learner'
ORDER BY p.created_at;

-- Also check if you have any instructor accounts:
SELECT 
  p.id, 
  p.name, 
  p.role,
  p.postcode,
  p.email,
  i.verification_status,
  p.created_at
FROM profiles p
LEFT JOIN instructors i ON p.id = i.id
WHERE p.role = 'instructor'
ORDER BY p.created_at;

-- If you don't have enough learner accounts, you can create some test ones:
-- Note: These will need to be created through Supabase Auth, not directly in the database
-- because of the foreign key constraint to auth.users

-- To create test users properly, you would need to:
-- 1. Use Supabase Auth to create user accounts
-- 2. Then insert corresponding profiles

-- Alternative: Check if you have any existing users that could be learners:
SELECT 
  p.id, 
  p.name, 
  p.role,
  CASE 
    WHEN p.role = 'learner' THEN 'Already a learner'
    WHEN p.role = 'instructor' THEN 'Could be instructor for certificates'
    ELSE 'Unknown role'
  END as status
FROM profiles p
ORDER BY p.role, p.name;
