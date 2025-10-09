-- Quick test with placeholder images (for immediate testing)
-- This will show the carousel working with placeholder images

INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status
) VALUES 
-- Use any existing user IDs from your profiles table
-- These will show placeholder images until you upload real ones
(
  (SELECT id FROM profiles WHERE role = 'learner' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1),
  'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Certificate+1',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved'
),
(
  (SELECT id FROM profiles WHERE role = 'learner' LIMIT 1 OFFSET 1),
  (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1 OFFSET 1),
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Certificate+2',
  '2024-01-22',
  'Bath Test Centre', 
  'Patient and professional. Highly recommend!',
  'approved'
),
(
  (SELECT id FROM profiles WHERE role = 'learner' LIMIT 1 OFFSET 2),
  (SELECT id FROM profiles WHERE role = 'instructor' LIMIT 1),
  'https://via.placeholder.com/400x300/047857/FFFFFF?text=Certificate+3',
  '2024-02-05',
  'Bristol Test Centre',
  'Great experience, passed with flying colors!',
  'approved'
);
