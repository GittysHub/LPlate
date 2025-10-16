-- Add Italian and Hindi languages to test instructors
-- This script updates existing instructors to have multiple languages for testing

-- First, let's see what instructors we have
SELECT instructors.id, profiles.name, instructors.languages FROM instructors 
JOIN profiles ON instructors.id = profiles.id 
WHERE instructors.verification_status = 'approved'
LIMIT 5;

-- Update a few instructors to have Italian as a second language
-- (assuming we have some instructors with just English)
UPDATE instructors 
SET languages = '["English", "Italian"]'::jsonb
WHERE instructors.id IN (
  SELECT instructors.id FROM instructors 
  WHERE instructors.verification_status = 'approved' 
  AND (instructors.languages IS NULL OR instructors.languages = '["English"]'::jsonb)
  LIMIT 2
);

-- Update a couple more instructors to have Hindi as a second language
UPDATE instructors 
SET languages = '["English", "Hindi"]'::jsonb
WHERE instructors.id IN (
  SELECT instructors.id FROM instructors 
  WHERE instructors.verification_status = 'approved' 
  AND (instructors.languages IS NULL OR instructors.languages = '["English"]'::jsonb)
  LIMIT 2
);

-- Update one instructor to have both Italian and Hindi (3 languages total)
UPDATE instructors 
SET languages = '["English", "Italian", "Hindi"]'::jsonb
WHERE instructors.id IN (
  SELECT instructors.id FROM instructors 
  WHERE instructors.verification_status = 'approved' 
  AND (instructors.languages IS NULL OR instructors.languages = '["English"]'::jsonb)
  LIMIT 1
);

-- Verify the updates
SELECT 
  p.name,
  i.languages,
  i.verification_status
FROM instructors i
JOIN profiles p ON i.id = p.id
WHERE i.verification_status = 'approved'
ORDER BY p.name;
