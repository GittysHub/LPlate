-- Test data for social proof submissions
-- Run this after uploading some images to Supabase Storage

-- First, upload some certificate images to the 'social-proof-certificates' bucket in Supabase Storage
-- Then replace these URLs with your actual uploaded image URLs

INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status
) VALUES 
-- Replace 'your-learner-id' and 'your-instructor-id' with actual user IDs
-- Replace the image URLs with your uploaded certificate URLs
(
  'your-learner-id-1',
  'your-instructor-id-1',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/social-proof-certificates/certificate1.jpg',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved'
),
(
  'your-learner-id-2', 
  'your-instructor-id-2',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/social-proof-certificates/certificate2.jpg',
  '2024-01-22',
  'Bath Test Centre',
  'Patient and professional. Highly recommend!',
  'approved'
),
(
  'your-learner-id-3',
  'your-instructor-id-3', 
  'https://your-supabase-url.supabase.co/storage/v1/object/public/social-proof-certificates/certificate3.jpg',
  '2024-02-05',
  'Bristol Test Centre',
  'Great experience, passed with flying colors!',
  'approved'
);

-- To get your user IDs, run this query:
-- SELECT id, name, role FROM profiles WHERE role IN ('learner', 'instructor');
