-- LPlate Stripe Connect Migration Script
-- This script adds Stripe Connect tables to your existing LPlate schema
-- It works with your current tables: profiles, instructors, bookings, availability

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to existing instructors table
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS hourly_rate_pence INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Convert hourly_rate to hourly_rate_pence if it exists
UPDATE instructors 
SET hourly_rate_pence = (hourly_rate * 100)::INTEGER 
WHERE hourly_rate IS NOT NULL AND hourly_rate_pence IS NULL;

-- Add constraint to hourly_rate_pence
ALTER TABLE instructors 
ADD CONSTRAINT check_hourly_rate_pence CHECK (hourly_rate_pence > 0);

-- Stripe Connect Accounts (enhanced with onboarding tracking)
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    country VARCHAR(2) NOT NULL,
    default_currency VARCHAR(3) DEFAULT 'gbp',
    requirements_due SMALLINT DEFAULT 0,
    disabled_reason TEXT,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (renamed from PAYMENTS for clarity)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_balance_txn_id VARCHAR(255),
    transfer_group VARCHAR(255),
    instructor_rate_pence INTEGER NOT NULL CHECK (instructor_rate_pence > 0),
    platform_fee_pence INTEGER NOT NULL CHECK (platform_fee_pence > 0),
    total_amount_pence INTEGER NOT NULL CHECK (total_amount_pence > 0),
    hours_booked_minutes INTEGER NOT NULL CHECK (hours_booked_minutes > 0),
    currency VARCHAR(3) DEFAULT 'gbp',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table (critical for payout triggering)
-- This extends your existing bookings table with Stripe-specific fields
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    completed_at TIMESTAMPTZ,
    price_pence INTEGER NOT NULL CHECK (price_pence > 0),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Link to existing booking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Ledger (append-only, concurrency-safe)
CREATE TABLE IF NOT EXISTS credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    delta_minutes INTEGER NOT NULL, -- Positive for purchases, negative for consumption
    source VARCHAR(50) NOT NULL CHECK (source IN ('PURCHASE', 'CONSUMPTION', 'REFUND', 'ADJUSTMENT')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Instructions (replaces PAYOUTS for better control)
CREATE TABLE IF NOT EXISTS payout_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
    eligible_on DATE NOT NULL, -- Next Friday after lesson completion
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUEUED', 'SENT', 'FAILED', 'REVERSED')),
    stripe_transfer_id VARCHAR(255),
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
    amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Codes (simple implementation)
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_amount_pence INTEGER CHECK (discount_amount_pence > 0),
    discount_percentage INTEGER CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT discount_type_check CHECK (
        (discount_amount_pence IS NOT NULL AND discount_percentage IS NULL) OR
        (discount_amount_pence IS NULL AND discount_percentage IS NOT NULL)
    )
);

-- Audit Logs (enhanced with webhook tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_source VARCHAR(50) DEFAULT 'APP' CHECK (event_source IN ('APP', 'WEBHOOK')),
    stripe_event_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Log (optional but helpful for debugging)
CREATE TABLE IF NOT EXISTS webhook_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0
);

-- Indexes for performance (as recommended by ChatGPT)
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_learner_created ON orders(learner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_instructor_created ON orders(instructor_id, created_at);

CREATE INDEX IF NOT EXISTS idx_lessons_instructor_start ON lessons(instructor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_lessons_learner_start ON lessons(learner_id, start_time);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_learner_instructor_created ON credit_ledger(learner_id, instructor_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payout_instructions_eligible_status ON payout_instructions(eligible_on, status);
CREATE INDEX IF NOT EXISTS idx_payout_instructions_stripe_transfer_id ON payout_instructions(stripe_transfer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_stripe_account_id ON stripe_connect_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = true;

-- Comments for documentation
COMMENT ON TABLE stripe_connect_accounts IS 'Stripe Connect account management with onboarding tracking';
COMMENT ON TABLE orders IS 'Payment orders with 18% platform fee added to instructor rate';
COMMENT ON TABLE lessons IS 'Lesson tracking - completion triggers Friday payouts';
COMMENT ON TABLE credit_ledger IS 'Append-only credit ledger for concurrency-safe hour tracking';
COMMENT ON TABLE payout_instructions IS 'Friday payout instructions generated from completed lessons';
COMMENT ON TABLE refunds IS 'Refund tracking for cancelled/disputed payments';
COMMENT ON TABLE discount_codes IS 'Simple discount codes (fixed amount or percentage)';
COMMENT ON TABLE audit_logs IS 'Audit trail for admin dashboard and compliance';
COMMENT ON TABLE webhook_log IS 'Webhook event tracking for debugging';

-- Key field comments
COMMENT ON COLUMN orders.instructor_rate_pence IS 'Instructor hourly rate (what they receive)';
COMMENT ON COLUMN orders.platform_fee_pence IS '18% platform commission (added to instructor rate)';
COMMENT ON COLUMN orders.total_amount_pence IS 'Total amount learner pays (instructor rate + platform fee)';
COMMENT ON COLUMN credit_ledger.delta_minutes IS 'Credit change: positive for purchases, negative for consumption';
COMMENT ON COLUMN payout_instructions.eligible_on IS 'Date when payout becomes eligible (next Friday after lesson completion)';
COMMENT ON COLUMN audit_logs.event_source IS 'Source of change: APP (user action) or WEBHOOK (Stripe event)';
