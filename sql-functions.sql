-- PostgreSQL function for atomic credit increment
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION add_lesson_hours(
  p_learner_id uuid,
  p_instructor_id uuid, 
  p_hours integer
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE learner_credits
  SET hours_used = hours_used + p_hours,
      updated_at = now()
  WHERE learner_id = p_learner_id 
    AND instructor_id = p_instructor_id
    AND is_active = true;
$$;

-- Also create a function for discount code usage increment
CREATE OR REPLACE FUNCTION increment_discount_usage(
  p_code text
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE discount_codes
  SET uses_count = uses_count + 1,
      updated_at = now()
  WHERE code = p_code;
$$;
