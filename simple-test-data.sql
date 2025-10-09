-- Simple test data for social proof submissions
-- This approach creates test users and submissions in one go

-- Step 1: Create test users with specific IDs for consistency
INSERT INTO profiles (id, name, role, postcode, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'learner', 'BS1 1AA', 'sarah@example.com'),
('22222222-2222-2222-2222-222222222222', 'James Smith', 'learner', 'BS2 2BB', 'james@example.com'),
('33333333-3333-3333-3333-333333333333', 'Emily Brown', 'learner', 'BS3 3CC', 'emily@example.com'),
('44444444-4444-4444-4444-444444444444', 'Mike Wilson', 'instructor', 'BS1 1AA', 'mike@example.com'),
('55555555-5555-5555-5555-555555555555', 'Emma Davis', 'instructor', 'BS2 2BB', 'emma@example.com')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create instructor records
INSERT INTO instructors (id, description, vehicle_type, hourly_rate, verification_status)
VALUES 
('44444444-4444-4444-4444-444444444444', 'Experienced driving instructor with 10+ years', 'manual', 35, 'approved'),
('55555555-5555-5555-5555-555555555555', 'Patient and friendly instructor', 'both', 32, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create social proof submissions
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
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Certificate+1',
  '2024-01-15',
  'Bristol Test Centre',
  'Amazing instructor! Made me feel confident and helped me pass first time.',
  'approved'
),
(
  '22222222-2222-2222-2222-222222222222', 
  '55555555-5555-5555-5555-555555555555',
  'https://via.placeholder.com/400x300/059669/FFFFFF?text=Certificate+2',
  '2024-01-22',
  'Bath Test Centre',
  'Patient and professional. Highly recommend!',
  'approved'
),
(
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444', 
  'https://via.placeholder.com/400x300/047857/FFFFFF?text=Certificate+3',
  '2024-02-05',
  'Bristol Test Centre',
  'Great experience, passed with flying colors!',
  'approved'
)
ON CONFLICT (id) DO NOTHING;
