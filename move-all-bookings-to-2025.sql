-- Move ALL bookings to October 2025 onwards for easier calendar testing
-- This script updates ALL existing bookings to be in October 2025 and later months

-- First, let's see what bookings we currently have
SELECT 
  b.id,
  b.start_at,
  b.end_at,
  b.price,
  b.status,
  p.name as learner_name,
  i.hourly_rate
FROM bookings b
JOIN profiles p ON b.learner_id = p.id
JOIN instructors i ON b.instructor_id = i.id
ORDER BY b.start_at;

-- Update ALL bookings to October 2025 onwards
-- We'll spread them across different days in October and November 2025

-- Get all booking IDs and update them systematically
WITH booking_updates AS (
  SELECT 
    b.id,
    ROW_NUMBER() OVER (ORDER BY b.start_at) as rn
  FROM bookings b
)
UPDATE bookings 
SET 
  start_at = CASE 
    WHEN bu.rn = 1 THEN '2025-10-01 10:00:00+00'
    WHEN bu.rn = 2 THEN '2025-10-03 14:00:00+00'
    WHEN bu.rn = 3 THEN '2025-10-08 09:00:00+00'
    WHEN bu.rn = 4 THEN '2025-10-15 13:00:00+00'
    WHEN bu.rn = 5 THEN '2025-10-22 15:00:00+00'
    WHEN bu.rn = 6 THEN '2025-11-05 11:00:00+00'
    WHEN bu.rn = 7 THEN '2025-11-12 16:00:00+00'
    WHEN bu.rn = 8 THEN '2025-11-19 14:00:00+00'
    WHEN bu.rn = 9 THEN '2025-12-03 10:00:00+00'
    WHEN bu.rn = 10 THEN '2025-12-10 15:00:00+00'
    ELSE '2025-10-01 10:00:00+00'
  END,
  end_at = CASE 
    WHEN bu.rn = 1 THEN '2025-10-01 12:00:00+00'
    WHEN bu.rn = 2 THEN '2025-10-03 15:30:00+00'
    WHEN bu.rn = 3 THEN '2025-10-08 11:00:00+00'
    WHEN bu.rn = 4 THEN '2025-10-15 14:00:00+00'
    WHEN bu.rn = 5 THEN '2025-10-22 17:00:00+00'
    WHEN bu.rn = 6 THEN '2025-11-05 12:30:00+00'
    WHEN bu.rn = 7 THEN '2025-11-12 18:00:00+00'
    WHEN bu.rn = 8 THEN '2025-11-19 16:00:00+00'
    WHEN bu.rn = 9 THEN '2025-12-03 12:00:00+00'
    WHEN bu.rn = 10 THEN '2025-12-10 17:00:00+00'
    ELSE '2025-10-01 12:00:00+00'
  END
FROM booking_updates bu
WHERE bookings.id = bu.id;

-- Verify the updated bookings
SELECT 
  b.id,
  b.start_at,
  b.end_at,
  b.price,
  b.status,
  p.name as learner_name,
  i.hourly_rate,
  EXTRACT(EPOCH FROM (b.end_at - b.start_at))/3600 as duration_hours
FROM bookings b
JOIN profiles p ON b.learner_id = p.id
JOIN instructors i ON b.instructor_id = i.id
WHERE b.start_at >= '2025-10-01'
ORDER BY b.start_at;

-- Show bookings by month for easy navigation
SELECT 
  TO_CHAR(b.start_at, 'YYYY-MM') as month,
  COUNT(*) as booking_count,
  STRING_AGG(DISTINCT TO_CHAR(b.start_at, 'DD'), ', ') as days_with_bookings
FROM bookings b
JOIN profiles p ON b.learner_id = p.id
WHERE b.start_at >= '2025-10-01'
GROUP BY TO_CHAR(b.start_at, 'YYYY-MM')
ORDER BY month;
