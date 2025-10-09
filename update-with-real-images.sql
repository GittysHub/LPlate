-- Update social proof submissions with your real certificate images
-- Replace the placeholder URLs with your actual Supabase Storage URLs

-- First, let's see what we currently have:
SELECT id, learner_name, instructor_name, certificate_image_url, status 
FROM social_proof_submissions 
ORDER BY created_at;

-- Update with your real certificate images
-- Replace 'your-supabase-url' with your actual Supabase project URL
-- The format should be: https://your-project-id.supabase.co/storage/v1/object/public/avatars/filename.png

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Jack.png'
WHERE learner_name = 'Sarah Johnson';

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/james.png'
WHERE learner_name = 'James Smith';

UPDATE social_proof_submissions 
SET certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mash.png'
WHERE learner_name = 'Emily Brown';

-- Add more submissions with your other images
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
  NULL,
  NULL,
  'Mo',
  'Emma Davis',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mo.png',
  '2024-02-10',
  'Bath Test Centre',
  'Fantastic instructor! Very patient and encouraging.',
  'approved'
),
(
  NULL,
  NULL,
  'Sass',
  'Mike Wilson',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Sass.png',
  '2024-02-15',
  'Bristol Test Centre',
  'Passed first time thanks to excellent teaching!',
  'approved'
);

-- Verify the updates
SELECT learner_name, instructor_name, certificate_image_url, test_location 
FROM social_proof_submissions 
WHERE status = 'approved'
ORDER BY test_date DESC;
