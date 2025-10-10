-- Helper Functions and Views for LPlate Stripe Connect Schema

-- Function to calculate next Friday (for payout eligibility)
CREATE OR REPLACE FUNCTION get_next_friday(input_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
DECLARE
    days_until_friday INTEGER;
BEGIN
    -- Calculate days until next Friday (5 = Friday in PostgreSQL)
    days_until_friday := (5 - EXTRACT(DOW FROM input_date))::INTEGER;
    
    -- If it's Friday or later in the week, get next Friday
    IF days_until_friday <= 0 THEN
        days_until_friday := days_until_friday + 7;
    END IF;
    
    RETURN input_date + INTERVAL '1 day' * days_until_friday;
END;
$$ LANGUAGE plpgsql;

-- Function to get current credit balance for a learner-instructor pair
CREATE OR REPLACE FUNCTION get_credit_balance(
    p_learner_id UUID,
    p_instructor_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    balance_minutes INTEGER;
BEGIN
    SELECT COALESCE(SUM(delta_minutes), 0)
    INTO balance_minutes
    FROM credit_ledger
    WHERE learner_id = p_learner_id
      AND instructor_id = p_instructor_id;
    
    RETURN balance_minutes;
END;
$$ LANGUAGE plpgsql;

-- View for current credit balances (materialized for performance)
CREATE MATERIALIZED VIEW current_credit_balances AS
SELECT 
    learner_id,
    instructor_id,
    SUM(delta_minutes) as balance_minutes,
    COUNT(*) as transaction_count,
    MAX(created_at) as last_transaction_at
FROM credit_ledger
GROUP BY learner_id, instructor_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_current_credit_balances_learner_instructor 
ON current_credit_balances(learner_id, instructor_id);

-- Function to refresh credit balances (call after credit ledger changes)
CREATE OR REPLACE FUNCTION refresh_credit_balances()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY current_credit_balances;
END;
$$ LANGUAGE plpgsql;

-- Function to add credit ledger entry (with automatic refresh)
CREATE OR REPLACE FUNCTION add_credit_entry(
    p_learner_id UUID,
    p_instructor_id UUID,
    p_delta_minutes INTEGER,
    p_source VARCHAR(50),
    p_order_id UUID DEFAULT NULL,
    p_lesson_id UUID DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    entry_id UUID;
BEGIN
    -- Insert credit ledger entry
    INSERT INTO credit_ledger (
        learner_id,
        instructor_id,
        delta_minutes,
        source,
        order_id,
        lesson_id,
        note
    ) VALUES (
        p_learner_id,
        p_instructor_id,
        p_delta_minutes,
        p_source,
        p_order_id,
        p_lesson_id,
        p_note
    ) RETURNING id INTO entry_id;
    
    -- Refresh materialized view
    PERFORM refresh_credit_balances();
    
    RETURN entry_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create payout instruction when lesson completes
CREATE OR REPLACE FUNCTION create_payout_instruction(
    p_lesson_id UUID
)
RETURNS UUID AS $$
DECLARE
    payout_id UUID;
    lesson_record RECORD;
    eligible_date DATE;
BEGIN
    -- Get lesson details
    SELECT l.*, i.hourly_rate_pence
    INTO lesson_record
    FROM lessons l
    JOIN instructors i ON l.instructor_id = i.id
    WHERE l.id = p_lesson_id
      AND l.status = 'completed';
    
    -- Check if lesson exists and is completed
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found or not completed: %', p_lesson_id;
    END IF;
    
    -- Calculate next Friday
    eligible_date := get_next_friday(lesson_record.completed_at::DATE);
    
    -- Create payout instruction
    INSERT INTO payout_instructions (
        instructor_id,
        lesson_id,
        amount_pence,
        eligible_on,
        idempotency_key
    ) VALUES (
        lesson_record.instructor_id,
        lesson_record.id,
        lesson_record.price_pence,
        eligible_date,
        'transfer:' || lesson_record.id::TEXT
    ) RETURNING id INTO payout_id;
    
    RETURN payout_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process eligible payouts (for daily job)
CREATE OR REPLACE FUNCTION process_eligible_payouts()
RETURNS TABLE(
    payout_id UUID,
    instructor_id UUID,
    lesson_id UUID,
    amount_pence INTEGER,
    stripe_transfer_id VARCHAR(255)
) AS $$
DECLARE
    payout_record RECORD;
BEGIN
    -- Get all eligible payouts
    FOR payout_record IN
        SELECT id, instructor_id, lesson_id, amount_pence
        FROM payout_instructions
        WHERE eligible_on <= CURRENT_DATE
          AND status = 'PENDING'
        ORDER BY eligible_on, created_at
    LOOP
        -- Update status to QUEUED
        UPDATE payout_instructions
        SET status = 'QUEUED',
            updated_at = NOW()
        WHERE id = payout_record.id;
        
        -- Return payout details for processing
        payout_id := payout_record.id;
        instructor_id := payout_record.instructor_id;
        lesson_id := payout_record.lesson_id;
        amount_pence := payout_record.amount_pence;
        stripe_transfer_id := NULL; -- Will be set after Stripe transfer
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to mark payout as sent
CREATE OR REPLACE FUNCTION mark_payout_sent(
    p_payout_id UUID,
    p_stripe_transfer_id VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
    UPDATE payout_instructions
    SET status = 'SENT',
        stripe_transfer_id = p_stripe_transfer_id,
        updated_at = NOW()
    WHERE id = p_payout_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark payout as failed
CREATE OR REPLACE FUNCTION mark_payout_failed(
    p_payout_id UUID,
    p_error_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE payout_instructions
    SET status = 'FAILED',
        updated_at = NOW()
    WHERE id = p_payout_id;
    
    -- Log the failure in audit logs
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        description
    ) VALUES (
        'payout_instruction',
        p_payout_id,
        'FAILED',
        jsonb_build_object('error_reason', p_error_reason),
        'Payout failed: ' || COALESCE(p_error_reason, 'Unknown error')
    );
END;
$$ LANGUAGE plpgsql;

-- View for admin dashboard - lesson summary
CREATE VIEW admin_lesson_summary AS
SELECT 
    l.id,
    l.start_time,
    l.end_time,
    l.duration_minutes,
    l.status,
    l.completed_at,
    l.price_pence,
    u_learner.name as learner_name,
    u_learner.email as learner_email,
    u_instructor.name as instructor_name,
    u_instructor.email as instructor_email,
    i.hourly_rate_pence,
    pi.status as payout_status,
    pi.eligible_on,
    pi.stripe_transfer_id
FROM lessons l
JOIN users u_learner ON l.learner_id = u_learner.id
JOIN instructors i ON l.instructor_id = i.id
JOIN users u_instructor ON i.user_id = u_instructor.id
LEFT JOIN payout_instructions pi ON l.id = pi.lesson_id
ORDER BY l.start_time DESC;

-- View for admin dashboard - payment summary
CREATE VIEW admin_payment_summary AS
SELECT 
    o.id,
    o.created_at,
    o.status,
    o.total_amount_pence,
    o.instructor_rate_pence,
    o.platform_fee_pence,
    o.hours_booked_minutes,
    u_learner.name as learner_name,
    u_instructor.name as instructor_name,
    COUNT(l.id) as lessons_count,
    SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END) as completed_lessons
FROM orders o
JOIN users u_learner ON o.learner_id = u_learner.id
JOIN instructors i ON o.instructor_id = i.id
JOIN users u_instructor ON i.user_id = u_instructor.id
LEFT JOIN lessons l ON o.id = l.order_id
GROUP BY o.id, o.created_at, o.status, o.total_amount_pence, 
         o.instructor_rate_pence, o.platform_fee_pence, o.hours_booked_minutes,
         u_learner.name, u_instructor.name
ORDER BY o.created_at DESC;

-- Comments for functions
COMMENT ON FUNCTION get_next_friday IS 'Calculates the next Friday date for payout eligibility';
COMMENT ON FUNCTION get_credit_balance IS 'Gets current credit balance for a learner-instructor pair';
COMMENT ON FUNCTION add_credit_entry IS 'Adds credit ledger entry and refreshes materialized view';
COMMENT ON FUNCTION create_payout_instruction IS 'Creates payout instruction when lesson completes';
COMMENT ON FUNCTION process_eligible_payouts IS 'Processes payouts eligible for today (daily job)';
COMMENT ON FUNCTION mark_payout_sent IS 'Marks payout as successfully sent to Stripe';
COMMENT ON FUNCTION mark_payout_failed IS 'Marks payout as failed and logs error';
COMMENT ON MATERIALIZED VIEW current_credit_balances IS 'Current credit balances for performance';
COMMENT ON VIEW admin_lesson_summary IS 'Admin dashboard view of all lessons';
COMMENT ON VIEW admin_payment_summary IS 'Admin dashboard view of all payments';
