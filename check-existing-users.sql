-- Alternative approach: Use existing users or create auth users first
-- This approach works with Supabase's auth system

-- Option 1: Check what users you already have
SELECT id, name, role FROM profiles WHERE role IN ('learner', 'instructor');

-- Option 2: If you have existing users, use them for social proof
-- Replace the IDs below with actual user IDs from your profiles table

-- First, let's see what we have:
-- Run this query to see your existing users:
SELECT 
  p.id, 
  p.name, 
  p.role,
  CASE WHEN i.id IS NOT NULL THEN 'Has instructor record' ELSE 'No instructor record' END as instructor_status
FROM profiles p
LEFT JOIN instructors i ON p.id = i.id
ORDER BY p.role, p.name;

-- Option 3: Create social proof using existing users
-- Replace the IDs below with actual IDs from your profiles table

-- Example (replace with your actual user IDs):
/*
INSERT INTO social_proof_submissions (
  learner_id,
  instructor_id,
  certificate_image_url,
  test_date,
  test_location,
  testimonial,
  status
) VALUES 
(
  'your-actual-learner-id-1',
  'your-actual-instructor-id-1',
  'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Certificate+1',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved'
),
(
  'your-actual-learner-id-2', 
  'your-actual-instructor-id-2',
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Certificate+2',
  '2024-01-22',
  'Bath Test Centre',
  'Patient and professional. Highly recommend!',
  'approved'
);
*/
