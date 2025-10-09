-- First, let's check what users you have in your database
-- Run this query first to see your existing users:

SELECT id, name, role FROM profiles WHERE role IN ('learner', 'instructor');

-- If you don't have enough users, create some test users first:

-- Create test learner profiles (if you don't have any)
INSERT INTO profiles (id, name, role, postcode, email) VALUES 
(gen_random_uuid(), 'Sarah Johnson', 'learner', 'BS1 1AA', 'sarah@example.com'),
(gen_random_uuid(), 'James Smith', 'learner', 'BS2 2BB', 'james@example.com'),
(gen_random_uuid(), 'Emily Brown', 'learner', 'BS3 3CC', 'emily@example.com')
ON CONFLICT (id) DO NOTHING;

-- Create test instructor profiles (if you don't have any)
INSERT INTO profiles (id, name, role, postcode, email) VALUES 
(gen_random_uuid(), 'Mike Wilson', 'instructor', 'BS1 1AA', 'mike@example.com'),
(gen_random_uuid(), 'Emma Davis', 'instructor', 'BS2 2BB', 'emma@example.com')
ON CONFLICT (id) DO NOTHING;

-- Then insert into instructors table for the instructor profiles
INSERT INTO instructors (id, description, vehicle_type, hourly_rate, verification_status)
SELECT 
  p.id,
  'Experienced driving instructor',
  'manual',
  35,
  'approved'
FROM profiles p 
WHERE p.role = 'instructor' 
AND NOT EXISTS (SELECT 1 FROM instructors i WHERE i.id = p.id);
