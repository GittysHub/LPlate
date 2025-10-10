# Stripe Connect MVP Database Schema - Consultation Brief

## Context
Building a marketplace MVP for connecting learners with driving instructors. Need a simplified database schema for Stripe Connect integration.

## Business Model
- **Learners** book lessons with **instructors**
- **Platform** takes 18% commission (added to instructor's rate, not deducted)
- **Instructors** receive their full listed rate
- **Credits system**: Learners can prepay for multiple hours with specific instructors
- **Automated payouts**: Instructors paid every Friday
- **Admin dashboard**: Need audit trails for booking/payment visibility

## Core Requirements
1. **Simple payment flow**: Instructor rate + 18% platform fee
2. **Hours tracking**: Prepaid credits tied to specific instructors
3. **Automated payouts**: Friday payouts to instructors
4. **Refund handling**: Essential for disputes/cancellations
5. **Admin visibility**: Audit logs for booking/payment tracking
6. **Simple discounts**: Fixed amount or percentage codes

## Proposed MVP Schema (9 Tables)

### User Management
- **USERS**: `id`, `email`, `name`, `role` (learner/instructor), `created_at`, `updated_at`
- **INSTRUCTORS**: `id`, `user_id` FK, `hourly_rate_pence`, `is_active`, `created_at`, `updated_at`
- **STRIPE_CONNECT_ACCOUNTS**: `id`, `instructor_id` FK, `stripe_account_id`, `status`, `charges_enabled`, `payouts_enabled`, `created_at`, `updated_at`

### Payment Processing
- **PAYMENTS**: `id`, `learner_id` FK, `instructor_id` FK, `stripe_payment_intent_id`, `instructor_rate_pence`, `platform_fee_pence`, `total_amount_pence`, `hours_booked`, `status`, `created_at`, `updated_at`
- **LEARNER_CREDITS**: `id`, `learner_id` FK, `instructor_id` FK, `hours_purchased`, `hours_used`, `is_active`, `created_at`, `updated_at`
- **PAYOUTS**: `id`, `instructor_id` FK, `stripe_transfer_id`, `amount_pence`, `status`, `payout_date`, `created_at`, `updated_at`
- **REFUNDS**: `id`, `payment_id` FK, `stripe_refund_id`, `amount_pence`, `reason`, `status`, `created_at`, `updated_at`

### Admin & Marketing
- **DISCOUNT_CODES**: `id`, `code`, `discount_amount_pence`, `discount_percentage`, `max_uses`, `uses_count`, `expires_at`, `is_active`, `created_at`, `updated_at`
- **AUDIT_LOGS**: `id`, `entity_type`, `entity_id`, `action`, `old_values` (JSON), `new_values` (JSON), `user_id` FK, `description`, `created_at`

## Key Relationships
- USERS → INSTRUCTORS (1:many)
- INSTRUCTORS → STRIPE_CONNECT_ACCOUNTS (1:1)
- USERS → PAYMENTS (1:many) - learners make payments
- INSTRUCTORS → PAYMENTS (1:many) - instructors receive payments
- USERS → LEARNER_CREDITS (1:many) - learners own credits
- INSTRUCTORS → LEARNER_CREDITS (1:many) - instructors provide credits
- INSTRUCTORS → PAYOUTS (1:many) - instructors receive payouts
- PAYMENTS → REFUNDS (1:many) - payments can have refunds
- USERS → AUDIT_LOGS (1:many) - users perform actions

## Questions for ChatGPT
1. **Is this schema appropriate for an MVP?** Any tables that could be simplified or combined?
2. **Payment flow validation**: Does the PAYMENTS table structure properly support "instructor rate + 18% platform fee" model?
3. **Credit system**: Is the LEARNER_CREDITS table design optimal for tracking prepaid hours per instructor?
4. **Audit logging**: Is the AUDIT_LOGS structure sufficient for admin dashboard needs?
5. **Stripe Connect integration**: Are there any missing fields for proper Stripe Connect account management?
6. **Performance considerations**: Any indexing recommendations for this schema?
7. **Scalability**: What would be the first bottlenecks as this grows beyond MVP?

## Technical Stack
- **Database**: PostgreSQL (Supabase)
- **Backend**: Next.js API routes
- **Payments**: Stripe Connect
- **Deployment**: Vercel

## Constraints
- Must be simple enough for MVP development
- Need admin visibility without complex reporting
- Focus on core marketplace functionality
- Can add complexity later (referral codes, reconciliation reports, etc.)
