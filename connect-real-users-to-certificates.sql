-- Connect your 5 real user accounts to the certificate images
-- First, let's create profiles for these users

-- Step 1: Create profiles for the 5 learners
INSERT INTO profiles (id, name, role, postcode, email) VALUES 
('83117ca6-4817-4777-9298-33366a857cd4', 'Sass', 'learner', 'BS1 1AA', 'sass@example.com'),
('8ad2dcc7-4be8-4548-b9c9-bc475ecd4bc3', 'Mo', 'learner', 'BS2 2BB', 'mo@example.com'),
('d4b3199a-9faa-424e-b3ce-d858c416e3f7', 'Mash', 'learner', 'BS3 3CC', 'mash@example.com'),
('8e2a673a-bdef-436e-8d9a-69833eb8cf57', 'James', 'learner', 'BS4 4DD', 'james@example.com'),
('a5e4f563-b0c9-4abf-9351-e2a8e3ed7fd4', 'Jack', 'learner', 'BS5 5EE', 'jack@example.com')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a couple of instructor profiles with proper UUIDs
-- Let's create 2 instructor accounts to pair with the learners
INSERT INTO profiles (id, name, role, postcode, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'Mike Wilson', 'instructor', 'BS1 1AA', 'mike@example.com'),
('22222222-2222-2222-2222-222222222222', 'Emma Davis', 'instructor', 'BS2 2BB', 'emma@example.com')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create instructor records
INSERT INTO instructors (id, description, vehicle_type, hourly_rate, verification_status) VALUES 
('11111111-1111-1111-1111-111111111111', 'Experienced instructor with 10+ years', 'manual', 35, 'approved'),
('22222222-2222-2222-2222-222222222222', 'Patient and friendly instructor', 'both', 32, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Update existing social proof submissions to use real learner IDs
UPDATE social_proof_submissions 
SET 
  learner_id = 'a5e4f563-b0c9-4abf-9351-e2a8e3ed7fd4',  -- Jack
  instructor_id = '11111111-1111-1111-1111-111111111111',  -- Mike Wilson
  certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Jack.png'
WHERE learner_name = 'Sarah Johnson';

UPDATE social_proof_submissions 
SET 
  learner_id = '8e2a673a-bdef-436e-8d9a-69833eb8cf57',  -- James
  instructor_id = '22222222-2222-2222-2222-222222222222',  -- Emma Davis
  certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/james.png'
WHERE learner_name = 'James Smith';

UPDATE social_proof_submissions 
SET 
  learner_id = 'd4b3199a-9faa-424e-b3ce-d858c416e3f7',  -- Mash
  instructor_id = '11111111-1111-1111-1111-111111111111',  -- Mike Wilson
  certificate_image_url = 'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mash.png'
WHERE learner_name = 'Emily Brown';

-- Step 5: Add the remaining 2 certificates as new submissions
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
  '8ad2dcc7-4be8-4548-b9c9-bc475ecd4bc3',  -- Mo
  '22222222-2222-2222-2222-222222222222',  -- Emma Davis
  'Mo',
  'Emma Davis',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Mo.png',
  '2024-02-10',
  'Bath Test Centre',
  'Fantastic instructor! Very patient and encouraging.',
  'approved'
),
(
  '83117ca6-4817-4777-9298-33366a857cd4',  -- Sass
  '11111111-1111-1111-1111-111111111111',  -- Mike Wilson
  'Sass',
  'Mike Wilson',
  'https://your-project-id.supabase.co/storage/v1/object/public/avatars/Sass.png',
  '2024-02-15',
  'Bristol Test Centre',
  'Passed first time thanks to excellent teaching!',
  'approved'
);

-- Step 6: Verify all connections
SELECT 
  sps.learner_name,
  sps.instructor_name,
  sps.test_location,
  sps.certificate_image_url,
  sps.status,
  p.name as profile_name,
  p.email
FROM social_proof_submissions sps
LEFT JOIN profiles p ON sps.learner_id = p.id
WHERE sps.status = 'approved'
ORDER BY sps.test_date DESC;
