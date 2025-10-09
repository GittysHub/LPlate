-- Stripe Connect Integration Schema for LPlate Marketplace
-- This schema supports the full payment flow from learner payment to instructor payout

-- ==============================================
-- STRIPE CONNECT ACCOUNTS
-- ==============================================

-- Store Stripe Connect account information for instructors
CREATE TABLE stripe_connect_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE NOT NULL, -- Stripe Connect account ID
  account_type text NOT NULL DEFAULT 'express', -- 'express', 'standard', 'custom'
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  details_submitted boolean DEFAULT false,
  requirements jsonb, -- Store Stripe requirements for account completion
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- PAYMENT TRANSACTIONS
-- ==============================================

-- Main payment transactions table
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Stripe payment details
  stripe_payment_intent_id text UNIQUE NOT NULL,
  stripe_transfer_id text, -- Transfer to instructor account
  
  -- Payment amounts (in pence)
  total_amount_pence integer NOT NULL, -- Total amount learner paid
  platform_fee_pence integer NOT NULL, -- 18% commission
  instructor_amount_pence integer NOT NULL, -- Amount instructor receives
  
  -- Payment status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')),
  
  -- Discount and referral tracking
  discount_code text,
  referral_code text,
  discount_amount_pence integer DEFAULT 0,
  
  -- Metadata
  payment_method text, -- 'card', 'bank_transfer', etc.
  currency text DEFAULT 'gbp',
  description text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- CREDIT SYSTEM
-- ==============================================

-- Learner credit balances (prepaid hours with specific instructors)
CREATE TABLE learner_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  
  -- Credit amounts
  total_hours_purchased numeric(5,2) NOT NULL DEFAULT 0, -- Total hours bought
  hours_used numeric(5,2) NOT NULL DEFAULT 0, -- Hours consumed
  hours_remaining numeric(5,2) GENERATED ALWAYS AS (total_hours_purchased - hours_used) STORED,
  
  -- Credit purchase details
  purchase_payment_id uuid REFERENCES payments(id), -- Original payment for credits
  hourly_rate_pence integer NOT NULL, -- Rate when credits were purchased
  
  -- Status
  is_active boolean DEFAULT true,
  expires_at timestamptz, -- Optional expiration date
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique credit account per learner-instructor pair
  UNIQUE(learner_id, instructor_id)
);

-- Credit usage tracking
CREATE TABLE credit_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id uuid REFERENCES learner_credits(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  
  hours_used numeric(5,2) NOT NULL,
  hourly_rate_pence integer NOT NULL, -- Rate at time of usage
  
  created_at timestamptz DEFAULT now()
);

-- ==============================================
-- PAYOUTS
-- ==============================================

-- Instructor payouts (Friday after lesson completion)
CREATE TABLE payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid REFERENCES instructors(id) ON DELETE CASCADE,
  stripe_payout_id text UNIQUE, -- Stripe payout ID
  
  -- Payout amounts
  total_amount_pence integer NOT NULL,
  platform_fee_pence integer NOT NULL,
  net_amount_pence integer NOT NULL,
  
  -- Payout period
  payout_date date NOT NULL, -- Friday payout date
  lesson_period_start date NOT NULL, -- Start of lessons included
  lesson_period_end date NOT NULL, -- End of lessons included
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'canceled')),
  
  -- Stripe details
  stripe_account_id text NOT NULL,
  destination_account text, -- Bank account or card
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link payouts to specific payments
CREATE TABLE payout_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid REFERENCES payouts(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(payout_id, payment_id)
);

-- ==============================================
-- DISCOUNTS & REFERRALS
-- ==============================================

-- Discount codes
CREATE TABLE discount_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  description text,
  
  -- Discount type and amount
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) NOT NULL, -- Percentage (0-100) or fixed amount in pence
  
  -- Usage limits
  max_uses integer,
  uses_count integer DEFAULT 0,
  
  -- Validity
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referral codes
CREATE TABLE referral_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Referral rewards
  referrer_reward_pence integer DEFAULT 0, -- Reward for referrer
  referee_discount_pence integer DEFAULT 0, -- Discount for referee
  
  -- Usage tracking
  uses_count integer DEFAULT 0,
  
  -- Validity
  is_active boolean DEFAULT true,
  valid_until timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- REFUNDS & DISPUTES
-- ==============================================

-- Refund tracking
CREATE TABLE refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  stripe_refund_id text UNIQUE,
  
  -- Refund amounts
  refund_amount_pence integer NOT NULL,
  platform_fee_refund_pence integer DEFAULT 0,
  instructor_refund_pence integer DEFAULT 0,
  
  -- Refund reason
  reason text NOT NULL CHECK (reason IN ('requested_by_customer', 'duplicate', 'fraudulent', 'other')),
  description text,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  -- Processing
  processed_by uuid REFERENCES profiles(id), -- Admin who processed
  processed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Stripe Connect accounts
CREATE INDEX idx_stripe_accounts_instructor ON stripe_connect_accounts(instructor_id);
CREATE INDEX idx_stripe_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);

-- Payments
CREATE INDEX idx_payments_learner ON payments(learner_id);
CREATE INDEX idx_payments_instructor ON payments(instructor_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);

-- Credits
CREATE INDEX idx_credits_learner ON learner_credits(learner_id);
CREATE INDEX idx_credits_instructor ON learner_credits(instructor_id);
CREATE INDEX idx_credits_active ON learner_credits(is_active) WHERE is_active = true;

-- Payouts
CREATE INDEX idx_payouts_instructor ON payouts(instructor_id);
CREATE INDEX idx_payouts_date ON payouts(payout_date);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Discounts and referrals
CREATE INDEX idx_discount_codes_active ON discount_codes(code) WHERE is_active = true;
CREATE INDEX idx_referral_codes_active ON referral_codes(code) WHERE is_active = true;

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your needs)
-- Instructors can view their own accounts and payments
CREATE POLICY "Instructors can view own stripe account" ON stripe_connect_accounts 
  FOR SELECT USING (instructor_id IN (SELECT id FROM instructors WHERE id = auth.uid()));

CREATE POLICY "Instructors can view own payments" ON payments 
  FOR SELECT USING (instructor_id IN (SELECT id FROM instructors WHERE id = auth.uid()));

CREATE POLICY "Instructors can view own payouts" ON payouts 
  FOR SELECT USING (instructor_id IN (SELECT id FROM instructors WHERE id = auth.uid()));

-- Learners can view their own payments and credits
CREATE POLICY "Learners can view own payments" ON payments 
  FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Learners can view own credits" ON learner_credits 
  FOR SELECT USING (learner_id = auth.uid());

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_stripe_accounts_updated_at BEFORE UPDATE ON stripe_connect_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON learner_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON referral_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate platform fee (18%)
CREATE OR REPLACE FUNCTION calculate_platform_fee(total_amount_pence integer)
RETURNS integer AS $$
BEGIN
    RETURN ROUND(total_amount_pence * 0.18);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get next Friday payout date
CREATE OR REPLACE FUNCTION get_next_payout_date(lesson_date date)
RETURNS date AS $$
DECLARE
    days_until_friday integer;
BEGIN
    -- Calculate days until next Friday (5 = Friday in PostgreSQL)
    days_until_friday := (5 - EXTRACT(DOW FROM lesson_date))::integer;
    
    -- If lesson is on Friday or later in week, get next Friday
    IF days_until_friday <= 0 THEN
        days_until_friday := days_until_friday + 7;
    END IF;
    
    RETURN lesson_date + INTERVAL '1 day' * days_until_friday;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE stripe_connect_accounts IS 'Stripe Connect accounts for instructors to receive payments';
COMMENT ON TABLE payments IS 'All payment transactions between learners and instructors';
COMMENT ON TABLE learner_credits IS 'Prepaid lesson credits for learners with specific instructors';
COMMENT ON TABLE payouts IS 'Scheduled payouts to instructors (every Friday)';
COMMENT ON TABLE discount_codes IS 'Discount codes for learners';
COMMENT ON TABLE referral_codes IS 'Referral system for user acquisition';
COMMENT ON TABLE refunds IS 'Refund tracking and processing';

COMMENT ON COLUMN payments.platform_fee_pence IS '18% commission added to instructor rate (platform keeps this)';
COMMENT ON COLUMN payments.instructor_amount_pence IS 'Amount instructor receives (their listed rate, not reduced)';
COMMENT ON COLUMN learner_credits.hours_remaining IS 'Automatically calculated remaining hours';
COMMENT ON COLUMN payouts.payout_date IS 'Friday payout date calculated from lesson completion';
