-- Debug script to check social proof data
-- Check what's in social_proof_submissions
SELECT 
  id,
  learner_id,
  instructor_id,
  test_date,
  test_location,
  status
FROM social_proof_submissions
ORDER BY created_at DESC;

-- Check what profiles exist
SELECT 
  id,
  name,
  email,
  role
FROM profiles
WHERE role = 'learner'
ORDER BY name;

-- Check what instructors exist
SELECT 
  i.id,
  p.name,
  p.email
FROM instructors i
JOIN profiles p ON i.id = p.id
ORDER BY p.name;

-- Check if learner_ids in social_proof_submissions exist in profiles
SELECT 
  sps.id as submission_id,
  sps.learner_id,
  sps.instructor_id,
  p.name as learner_name,
  p.email as learner_email
FROM social_proof_submissions sps
LEFT JOIN profiles p ON sps.learner_id = p.id
WHERE sps.status = 'approved'
ORDER BY sps.test_date DESC;
