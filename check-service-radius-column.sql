-- Quick check to see if service_radius_miles column exists and has data
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'instructors' 
  AND column_name = 'service_radius_miles';

-- Check if any instructors have service radius values
SELECT 
  COUNT(*) as total,
  COUNT(service_radius_miles) as with_radius,
  MIN(service_radius_miles) as min_radius,
  MAX(service_radius_miles) as max_radius,
  AVG(service_radius_miles) as avg_radius
FROM instructors;
