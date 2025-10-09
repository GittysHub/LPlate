-- Simple approach: Create social proof without creating new users
-- This works by using the existing mock data approach but storing it in the database

-- First, let's create a temporary table to hold our test data
CREATE TEMP TABLE temp_social_proof AS
SELECT 
  'mock-learner-1' as learner_name,
  'mock-instructor-1' as instructor_name,
  'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Certificate+1' as certificate_image_url,
  '2024-01-15'::date as test_date,
  'Bristol Test Centre' as test_location,
  'Amazing instructor! Made me feel confident and helped me pass first time.' as testimonial
UNION ALL
SELECT 
  'mock-learner-2',
  'mock-instructor-2',
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Certificate+2',
  '2024-01-22'::date,
  'Bath Test Centre',
  'Patient and professional. Highly recommend!'
UNION ALL
SELECT 
  'mock-learner-3',
  'mock-instructor-3',
  'https://via.placeholder.com/400x300/047857/FFFFFF?text=Certificate+3',
  '2024-02-05'::date,
  'Bristol Test Centre',
  'Great experience, passed with flying colors!';

-- Insert into social_proof_submissions with NULL foreign keys (we'll handle this in the app)
INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status
)
SELECT 
  NULL as learner_id,  -- We'll handle this in the app
  NULL as instructor_id,  -- We'll handle this in the app
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  'approved' as status
FROM temp_social_proof;

-- Clean up
DROP TABLE temp_social_proof;
