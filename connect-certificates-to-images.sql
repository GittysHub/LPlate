-- Solution: Connect your 5 certificate images to existing or create simple mappings
-- This approach works regardless of how many learner accounts you have

-- Step 1: Check what you currently have
SELECT COUNT(*) as learner_count FROM profiles WHERE role = 'learner';
SELECT COUNT(*) as instructor_count FROM profiles WHERE role = 'instructor';

-- Step 2: If you have existing learners, we can use them
-- If not, we'll use the mock data approach with your real images

-- Option A: If you have existing learners, update the mock data to use real learner IDs
-- Replace the NULL values with actual learner IDs from your profiles table

-- Option B: Keep using mock data but with your real images (recommended for now)
-- This way you can see the certificates working immediately

-- Update the existing mock submissions with your real certificate images
-- Replace 'your-project-id' with your actual Supabase project ID

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Jack.png'
WHERE learner_name = 'Sarah Johnson';

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/james.png'
WHERE learner_name = 'James Smith';

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mash.png'
WHERE learner_name = 'Emily Brown';

-- Add the remaining 2 certificates as new submissions
INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  learner_name,
  instructor_name,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status
) VALUES 
(
  NULL,  -- Mock learner
  NULL,  -- Mock instructor
  'Mo',
  'Emma Davis',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mo.png',
  '2024-02-10',
  'Bath Test Centre',
  'Fantastic instructor! Very patient and encouraging.',
  'approved'
),
(
  NULL,  -- Mock learner
  NULL,  -- Mock instructor
  'Sass',
  'Mike Wilson',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Sass.png',
  '2024-02-15',
  'Bristol Test Centre',
  'Passed first time thanks to excellent teaching!',
  'approved'
);

-- Verify all 5 certificates are now in the database
SELECT 
  learner_name, 
  instructor_name, 
  test_location,
  certificate_image_url,
  status
FROM social_proof_submissions 
WHERE status = 'approved'
ORDER BY test_date DESC;
