-- Move all test bookings to October 2024 onwards for easier calendar testing
-- This script updates existing bookings to be in October 2024 and later months

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

-- Update bookings to October 2025 onwards
-- We'll spread them across different days in October and November 2025

-- Booking 1: October 1st, 2025 (Wednesday) - 2 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-10-01 10:00:00+00',
  end_at = '2025-10-01 12:00:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1
);

-- Booking 2: October 3rd, 2025 (Friday) - 1.5 hour lesson  
UPDATE bookings 
SET 
  start_at = '2025-10-03 14:00:00+00',
  end_at = '2025-10-03 15:30:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 1
);

-- Booking 3: October 8th, 2025 (Wednesday) - 2 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-10-08 09:00:00+00',
  end_at = '2025-10-08 11:00:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 2
);

-- Booking 4: October 15th, 2025 (Wednesday) - 1 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-10-15 13:00:00+00',
  end_at = '2025-10-15 14:00:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 3
);

-- Booking 5: October 22nd, 2025 (Wednesday) - 2 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-10-22 15:00:00+00',
  end_at = '2025-10-22 17:00:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 4
);

-- Booking 6: November 5th, 2025 (Wednesday) - 1.5 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-11-05 11:00:00+00',
  end_at = '2025-11-05 12:30:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 5
);

-- Booking 7: November 12th, 2025 (Wednesday) - 2 hour lesson
UPDATE bookings 
SET 
  start_at = '2025-11-12 16:00:00+00',
  end_at = '2025-11-12 18:00:00+00'
WHERE id IN (
  SELECT b.id FROM bookings b 
  JOIN profiles p ON b.learner_id = p.id 
  WHERE p.name LIKE '%Test%' OR p.name LIKE '%LGT%'
  LIMIT 1 OFFSET 6
);

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
