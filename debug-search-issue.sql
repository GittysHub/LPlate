-- Debug script to check what's happening with the search
-- Run this in Supabase SQL editor to diagnose the issue

-- 1. Check if we have any instructors at all
SELECT 
  COUNT(*) as total_instructors,
  COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_instructors,
  COUNT(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 1 END) as instructors_with_coords,
  COUNT(CASE WHEN service_radius_miles IS NOT NULL THEN 1 END) as instructors_with_radius
FROM instructors;

-- 2. Check specific instructor data
SELECT 
  i.id,
  p.name,
  i.base_postcode,
  i.service_radius_miles,
  i.verification_status,
  i.lat,
  i.lng,
  i.vehicle_type,
  i.gender,
  i.hourly_rate
FROM instructors i
JOIN profiles p ON i.id = p.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. Test geocoding for BS1 3DB (this should work)
-- You can test this manually by visiting: https://api.postcodes.io/postcodes/BS1%203DB

-- 4. Check if there are any instructors within a reasonable distance of Bristol
-- (BS1 3DB is in Bristol city center)
SELECT 
  i.id,
  p.name,
  i.base_postcode,
  i.service_radius_miles,
  i.lat,
  i.lng,
  -- Calculate approximate distance from Bristol city center (51.4545, -2.5879)
  CASE 
    WHEN i.lat IS NOT NULL AND i.lng IS NOT NULL THEN
      ROUND(
        6371 * acos(
          cos(radians(51.4545)) * cos(radians(i.lat)) * 
          cos(radians(i.lng) - radians(-2.5879)) + 
          sin(radians(51.4545)) * sin(radians(i.lat))
        ) * 0.621371, 2
      )
    ELSE NULL
  END as distance_miles_from_bristol
FROM instructors i
JOIN profiles p ON i.id = p.id
WHERE i.verification_status = 'approved'
  AND i.lat IS NOT NULL 
  AND i.lng IS NOT NULL
ORDER BY distance_miles_from_bristol ASC;
