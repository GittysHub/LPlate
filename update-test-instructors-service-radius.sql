-- Update service radius for existing test instructors
-- This will set different service radii for variety in testing

-- Update instructors with specific IDs (replace with your actual instructor IDs)
UPDATE instructors 
SET service_radius_miles = 15 
WHERE id = 'your-instructor-id-1';

UPDATE instructors 
SET service_radius_miles = 10 
WHERE id = 'your-instructor-id-2';

UPDATE instructors 
SET service_radius_miles = 25 
WHERE id = 'your-instructor-id-3';

-- Or update all instructors at once with a default radius
UPDATE instructors 
SET service_radius_miles = 12 
WHERE service_radius_miles IS NULL;

-- Check the results
SELECT id, base_postcode, service_radius_miles, hourly_rate 
FROM instructors 
WHERE verification_status = 'approved'
ORDER BY service_radius_miles;
