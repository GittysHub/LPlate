-- Move specific test bookings from screenshot to October 2025
-- Based on the exact booking IDs shown in the database table

-- First, let's see the current state of these specific bookings
SELECT
  id,
  start_at,
  end_at,
  note,
  status,
  EXTRACT(EPOCH FROM (end_at - start_at))/3600 as duration_hours
FROM bookings
WHERE id IN (
  '15b5c64e-4df7-4820-94f7-ce52de60f80d',
  '6e4988c3-e0d5-40ca-96a4-4de5ddc3e6ce',
  '75ac24ee-1bd1-4b21-a4ac-c31e71b0f98f',
  '7c448db6-e3e6-43d3-8e1a-245c53dc7bd8',
  '8bc04b64-0ca7-4882-80b8-73cc73cf3fd3',
  '94c6c26d-fe11-497f-a14b-3f639987f14b',
  'b7cf2091-1306-4dc2-a4a4-78741713ceb7',
  'd109bfb7-390e-4783-8d83-89848f61fbfa',
  'd473e2dc-b52d-426c-8cd7-c3157dd2d5c0',
  'fb2dbe63-8979-4b03-99c5-099412f4fa34'
)
ORDER BY start_at;

-- Update bookings to October 2025 onwards
-- October 2025 starts on a Wednesday

-- Booking 1: 2-hour lesson (was 2024-01-23)
UPDATE bookings
SET
  start_at = '2025-10-01 10:00:00+00', -- Wednesday
  end_at = '2025-10-01 12:00:00+00'
WHERE id = '15b5c64e-4df7-4820-94f7-ce52de60f80d';

-- Booking 2: 2-hour lesson (was 2024-01-16)
UPDATE bookings
SET
  start_at = '2025-10-03 14:00:00+00', -- Friday
  end_at = '2025-10-03 16:00:00+00'
WHERE id = '6e4988c3-e0d5-40ca-96a4-4de5ddc3e6ce';

-- Booking 3: 2-hour lesson (was 2024-01-18)
UPDATE bookings
SET
  start_at = '2025-10-06 16:00:00+00', -- Monday
  end_at = '2025-10-06 18:00:00+00'
WHERE id = '75ac24ee-1bd1-4b21-a4ac-c31e71b0f98f';

-- Booking 4: 1.5-hour lesson (was already 2025-10-03)
UPDATE bookings
SET
  start_at = '2025-10-08 09:00:00+00', -- Wednesday
  end_at = '2025-10-08 10:30:00+00'
WHERE id = '7c448db6-e3e6-43d3-8e1a-245c53dc7bd8';

-- Booking 5: 2-hour lesson (was 2024-01-30)
UPDATE bookings
SET
  start_at = '2025-10-10 09:00:00+00', -- Friday
  end_at = '2025-10-10 11:00:00+00'
WHERE id = '8bc04b64-0ca7-4882-80b8-73cc73cf3fd3';

-- Booking 6: 2-hour lesson (was 2024-01-25)
UPDATE bookings
SET
  start_at = '2025-10-13 09:00:00+00', -- Monday
  end_at = '2025-10-13 11:00:00+00'
WHERE id = '94c6c26d-fe11-497f-a14b-3f639987f14b';

-- Booking 7: 2-hour lesson (was 2024-01-20)
UPDATE bookings
SET
  start_at = '2025-10-15 14:00:00+00', -- Wednesday
  end_at = '2025-10-15 16:00:00+00'
WHERE id = 'b7cf2091-1306-4dc2-a4a4-78741713ceb7';

-- Booking 8: 1.5-hour lesson (was already 2025-10-03)
UPDATE bookings
SET
  start_at = '2025-10-17 14:00:00+00', -- Friday
  end_at = '2025-10-17 15:30:00+00'
WHERE id = 'd109bfb7-390e-4783-8d83-89848f61fbfa';

-- Booking 9: 2-hour lesson (was already 2025-10-17)
UPDATE bookings
SET
  start_at = '2025-10-20 17:00:00+00', -- Monday
  end_at = '2025-10-20 19:00:00+00'
WHERE id = 'd473e2dc-b52d-426c-8cd7-c3157dd2d5c0';

-- Booking 10: 2-hour lesson (was 2024-01-15)
UPDATE bookings
SET
  start_at = '2025-10-22 10:00:00+00', -- Wednesday
  end_at = '2025-10-22 12:00:00+00'
WHERE id = 'fb2dbe63-8979-4b03-99c5-099412f4fa34';

-- Verify the updated bookings
SELECT
  id,
  start_at,
  end_at,
  note,
  status,
  EXTRACT(EPOCH FROM (end_at - start_at))/3600 as duration_hours
FROM bookings
WHERE id IN (
  '15b5c64e-4df7-4820-94f7-ce52de60f80d',
  '6e4988c3-e0d5-40ca-96a4-4de5ddc3e6ce',
  '75ac24ee-1bd1-4b21-a4ac-c31e71b0f98f',
  '7c448db6-e3e6-43d3-8e1a-245c53dc7bd8',
  '8bc04b64-0ca7-4882-80b8-73cc73cf3fd3',
  '94c6c26d-fe11-497f-a14b-3f639987f14b',
  'b7cf2091-1306-4dc2-a4a4-78741713ceb7',
  'd109bfb7-390e-4783-8d83-89848f61fbfa',
  'd473e2dc-b52d-426c-8cd7-c3157dd2d5c0',
  'fb2dbe63-8979-4b03-99c5-099412f4fa34'
)
ORDER BY start_at;

-- Show bookings by day for easy calendar navigation
SELECT 
  TO_CHAR(start_at, 'YYYY-MM-DD') as date,
  TO_CHAR(start_at, 'Day') as day_name,
  COUNT(*) as booking_count,
  STRING_AGG(
    CONCAT(
      TO_CHAR(start_at, 'HH24:MI'), 
      '-', 
      TO_CHAR(end_at, 'HH24:MI'),
      ' (', 
      EXTRACT(EPOCH FROM (end_at - start_at))/3600, 
      'h)'
    ), 
    ', '
  ) as time_slots
FROM bookings
WHERE id IN (
  '15b5c64e-4df7-4820-94f7-ce52de60f80d',
  '6e4988c3-e0d5-40ca-96a4-4de5ddc3e6ce',
  '75ac24ee-1bd1-4b21-a4ac-c31e71b0f98f',
  '7c448db6-e3e6-43d3-8e1a-245c53dc7bd8',
  '8bc04b64-0ca7-4882-80b8-73cc73cf3fd3',
  '94c6c26d-fe11-497f-a14b-3f639987f14b',
  'b7cf2091-1306-4dc2-a4a4-78741713ceb7',
  'd109bfb7-390e-4783-8d83-89848f61fbfa',
  'd473e2dc-b52d-426c-8cd7-c3157dd2d5c0',
  'fb2dbe63-8979-4b03-99c5-099412f4fa34'
)
GROUP BY TO_CHAR(start_at, 'YYYY-MM-DD'), TO_CHAR(start_at, 'Day')
ORDER BY TO_CHAR(start_at, 'YYYY-MM-DD');
