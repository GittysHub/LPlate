-- Better approach: Modify the schema to allow NULL foreign keys for mock data
-- This allows us to have social proof without requiring real users

-- First, let's make the foreign key columns nullable for mock data
ALTER TABLE social_proof_submissions 
ALTER COLUMN learner_id DROP NOT NULL,
ALTER COLUMN instructor_id DROP NOT NULL;

-- Add a field to distinguish between real and mock submissions
ALTER TABLE social_proof_submissions 
ADD COLUMN is_mock_data BOOLEAN DEFAULT FALSE;

-- Now insert mock data
INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status,
  is_mock_data
) VALUES 
(
  NULL,  -- Mock learner
  NULL,  -- Mock instructor
  'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Certificate+1',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved',
  TRUE
),
(
  NULL,  -- Mock learner
  NULL,  -- Mock instructor
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Certificate+2',
  '2024-01-22',
  'Bath Test Centre',
  'Patient and professional. Highly recommend!',
  'approved',
  TRUE
),
(
  NULL,  -- Mock learner
  NULL,  -- Mock instructor
  'https://via.placeholder.com/400x300/047857/FFFFFF?text=Certificate+3',
  '2024-02-05',
  'Bristol Test Centre',
  'Great experience, passed with flying colors!',
  'approved',
  TRUE
);
