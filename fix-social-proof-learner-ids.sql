-- Fix social proof submissions to use correct learner IDs
-- First, let's see what we have
SELECT 'Current social_proof_submissions:' as info;
SELECT 
  id,
  learner_id,
  instructor_id,
  test_date,
  test_location,
  status
FROM social_proof_submissions
ORDER BY created_at DESC;

SELECT 'Available learner profiles:' as info;
SELECT 
  id,
  name,
  email
FROM profiles
WHERE role = 'learner'
ORDER BY name;

-- Update social_proof_submissions to use correct learner IDs
-- We'll map them by email since we know the emails from the test accounts

-- Update Jack's submission
UPDATE social_proof_submissions 
SET learner_id = (SELECT id FROM profiles WHERE email = 'jack@example.com')
WHERE certificate_image_url LIKE '%Jack.png%';

-- Update James's submission  
UPDATE social_proof_submissions 
SET learner_id = (SELECT id FROM profiles WHERE email = 'james@example.com')
WHERE certificate_image_url LIKE '%james.png%';

-- Update Mash's submission
UPDATE social_proof_submissions 
SET learner_id = (SELECT id FROM profiles WHERE email = 'mash@example.com')
WHERE certificate_image_url LIKE '%Mash.png%';

-- Update Mo's submission
UPDATE social_proof_submissions 
SET learner_id = (SELECT id FROM profiles WHERE email = 'mo@example.com')
WHERE certificate_image_url LIKE '%Mo.png%';

-- Update Sass's submission
UPDATE social_proof_submissions 
SET learner_id = (SELECT id FROM profiles WHERE email = 'sass@example.com')
WHERE certificate_image_url LIKE '%Sass.png%';

-- Verify the updates
SELECT 'Updated social_proof_submissions:' as info;
SELECT 
  sps.id,
  sps.learner_id,
  sps.instructor_id,
  sps.test_date,
  sps.test_location,
  p.name as learner_name,
  p.email as learner_email,
  sps.status
FROM social_proof_submissions sps
LEFT JOIN profiles p ON sps.learner_id = p.id
WHERE sps.status = 'approved'
ORDER BY sps.test_date DESC;
