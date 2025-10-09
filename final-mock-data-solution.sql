-- Simple solution: Add name columns to store mock data directly
-- This avoids foreign key constraints while still allowing real user data

-- Add columns for storing names directly (for mock data)
ALTER TABLE social_proof_submissions 
ADD COLUMN learner_name TEXT,
ADD COLUMN instructor_name TEXT;

-- Make foreign keys nullable to allow mock data
ALTER TABLE social_proof_submissions 
ALTER COLUMN learner_id DROP NOT NULL,
ALTER COLUMN instructor_id DROP NOT NULL;

-- Insert mock data with names stored directly
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
  NULL,  -- No real learner
  NULL,  -- No real instructor
  'Sarah Johnson',
  'Mike Wilson',
  'https://picsum.photos/400/300?random=1',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved'
),
(
  NULL,  -- No real learner
  NULL,  -- No real instructor
  'James Smith',
  'Emma Davis',
  'https://picsum.photos/400/300?random=2',
  '2024-01-22',
  'Bath Test Centre',
  'Patient and professional. Highly recommend!',
  'approved'
),
(
  NULL,  -- No real learner
  NULL,  -- No real instructor
  'Emily Brown',
  'Mike Wilson',
  'https://picsum.photos/400/300?random=3',
  '2024-02-05',
  'Bristol Test Centre',
  'Great experience, passed with flying colors!',
  'approved'
);
