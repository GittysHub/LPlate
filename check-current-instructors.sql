-- Check current instructors and their service radius values
SELECT 
  i.id,
  p.name,
  i.base_postcode,
  i.service_radius_miles,
  i.hourly_rate,
  i.verification_status,
  i.lat,
  i.lng
FROM instructors i
JOIN profiles p ON i.id = p.id
ORDER BY i.created_at DESC;
