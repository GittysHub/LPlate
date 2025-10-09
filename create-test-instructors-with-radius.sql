-- Create test instructors with different service radii
-- Note: You'll need to replace the UUIDs with actual profile IDs

-- Example: Create instructor profiles first (if they don't exist)
-- INSERT INTO profiles (id, name, role, postcode, email) VALUES
-- ('test-instructor-1', 'John Smith', 'instructor', 'BS1 3BD', 'john@example.com'),
-- ('test-instructor-2', 'Sarah Johnson', 'instructor', 'BS2 4EF', 'sarah@example.com'),
-- ('test-instructor-3', 'Mike Wilson', 'instructor', 'BS3 5GH', 'mike@example.com');

-- Then create instructor records with service radii
INSERT INTO instructors (
  id,
  description,
  gender,
  base_postcode,
  vehicle_type,
  hourly_rate,
  adi_badge,
  verification_status,
  lat,
  lng,
  service_radius_miles
) VALUES
(
  'test-instructor-1',
  'Experienced driving instructor with 10+ years teaching.',
  'male',
  'BS1 3BD',
  'both',
  35.00,
  true,
  'approved',
  51.4545,
  -2.5879,
  15  -- 15 mile service radius
),
(
  'test-instructor-2',
  'Patient and friendly instructor specializing in nervous learners.',
  'female',
  'BS2 4EF',
  'auto',
  40.00,
  true,
  'approved',
  51.4607,
  -2.5845,
  10  -- 10 mile service radius
),
(
  'test-instructor-3',
  'Professional instructor with excellent pass rates.',
  'male',
  'BS3 5GH',
  'manual',
  30.00,
  true,
  'approved',
  51.4485,
  -2.5923,
  25  -- 25 mile service radius
);
