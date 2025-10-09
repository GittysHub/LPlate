-- Add service_radius_miles field to instructors table
-- This allows instructors to set how far they're willing to travel to meet learners

-- Add the service_radius_miles column
ALTER TABLE instructors 
ADD COLUMN service_radius_miles INTEGER DEFAULT 10;

-- Add a check constraint to ensure reasonable radius values (1-50 miles)
ALTER TABLE instructors 
ADD CONSTRAINT check_service_radius 
CHECK (service_radius_miles >= 1 AND service_radius_miles <= 50);

-- Update existing instructors with a default radius of 10 miles
UPDATE instructors 
SET service_radius_miles = 10 
WHERE service_radius_miles IS NULL;

-- Add comment to document the field
COMMENT ON COLUMN instructors.service_radius_miles IS 'Maximum distance in miles the instructor is willing to travel from their base_postcode to meet learners';

-- Create an index for better query performance
CREATE INDEX idx_instructors_service_radius ON instructors(service_radius_miles);

-- Example query to find instructors within their service radius of a given postcode:
-- This would be used in the application to filter instructors
/*
SELECT i.*, p.name, p.avatar_url
FROM instructors i
JOIN profiles p ON i.id = p.id
WHERE i.verification_status = 'approved'
  AND i.lat IS NOT NULL 
  AND i.lng IS NOT NULL
  AND ST_DWithin(
    ST_Point(i.lng, i.lat)::geography,
    ST_Point(learner_lng, learner_lat)::geography,
    i.service_radius_miles * 1609.34  -- Convert miles to meters
  );
*/
