# 🎯 L Plate Stripe Connect Integration - Project Brief

## 📋 Project Overview

**Project**: Stripe Connect Integration for L Plate Marketplace  
**Status**: Phase 1 - Foundation Setup  
**Timeline**: 3-week MVP implementation  
**Readiness Score**: 75% (Core functionality ready, needs operational hardening)

## 🎯 Business Requirements

### Core Payment Flow
- **Instructors** list their hourly rate (e.g., £30/hour)
- **Learners** pay instructor rate + 18% platform fee (e.g., £35.40 total)
- **Platform** keeps 18% commission automatically
- **Instructors** receive their full listed rate (e.g., £30)
- **Payouts** occur every Friday after lesson completion

### Credit System
- Learners can prepay for multiple hours with specific instructors
- Credits are automatically deducted as lessons are completed
- Real-time balance tracking per instructor

### Key Features
- Stripe Connect Express accounts for instructors
- Automated commission calculation (18% added to instructor rate)
- Friday payout scheduling (7 days after lesson completion)
- Discount and referral code support
- Refund and dispute handling

## 🏗️ Technical Architecture

### Database Schema
- **Core Tables**: `payments`, `payouts`, `learner_credits`, `stripe_connect_accounts`
- **Supporting Tables**: `discount_codes`, `referral_codes`, `refunds`
- **Audit Tables**: `audit_logs`, `reconciliation_reports` (to be added)

### API Endpoints
- `POST /api/stripe-connect/account` - Create instructor Connect account
- `POST /api/payments` - Process lesson payments
- `POST /api/payouts` - Process Friday payouts
- `GET /api/credits` - Manage learner credits
- `POST /api/webhooks/stripe-connect` - Handle Connect events
- `POST /api/webhooks/stripe-payments` - Handle payment events

### Key Files Created
- `stripe-connect-schema.sql` - Complete database schema
- `src/lib/stripe.ts` - Stripe configuration and utilities
- `src/app/api/stripe-connect/account/route.ts` - Account management
- `src/app/api/payments/route.ts` - Payment processing
- `src/app/api/payouts/route.ts` - Payout system
- `src/app/api/credits/route.ts` - Credit management
- `src/app/api/webhooks/stripe-connect/route.ts` - Connect webhooks
- `src/app/api/webhooks/stripe-payments/route.ts` - Payment webhooks

## 🚀 Implementation Phases

### Phase 1: Foundation Setup (Week 1)
**Goal**: Get basic Stripe Connect working

#### Tasks:
1. **Stripe Account Setup**
   - Enable Stripe Connect in existing business account
   - Create webhook endpoints for Connect and Payment events
   - Get API keys and update environment variables
   - Test webhook delivery with ngrok

2. **Database Setup**
   - Run `stripe-connect-schema.sql` in Supabase
   - Verify all tables created successfully
   - Test basic database connectivity

3. **Environment Configuration**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
   STRIPE_PAYMENTS_WEBHOOK_SECRET=whsec_...
   ```

4. **Basic Testing**
   - Test instructor account creation
   - Test payment processing with Stripe test cards
   - Verify commission calculations

#### Success Criteria:
- ✅ Stripe Connect enabled in dashboard
- ✅ Webhooks configured and receiving events
- ✅ Database schema deployed
- ✅ Basic payment flow working

### Phase 2: Core MVP Features (Week 2)
**Goal**: Complete payment and credit system

#### Tasks:
1. **Payment Processing**
   - Test lesson payments with real Stripe test cards
   - Verify 18% commission calculation
   - Test discount code application
   - Test referral code handling

2. **Credit System**
   - Test credit purchase functionality
   - Test credit usage for bookings
   - Verify balance tracking and updates
   - Test credit expiration (if applicable)

3. **Instructor Onboarding**
   - Test Stripe Connect account creation
   - Test account verification flow
   - Test login link generation
   - Verify account status tracking

#### Success Criteria:
- ✅ Learners can pay for lessons
- ✅ Instructors receive correct amounts
- ✅ Platform receives 18% commission
- ✅ Credit system fully functional

### Phase 3: Operations & Hardening (Week 3)
**Goal**: Production-ready operations

#### Tasks:
1. **Payout Processing**
   - Implement automated Friday payout scheduling
   - Test payout creation and execution
   - Add retry logic for failed payouts
   - Test transfer to instructor accounts

2. **Error Handling**
   - Add idempotency protection to prevent duplicate payments
   - Implement webhook retry logic
   - Add comprehensive error logging
   - Create basic audit trail

3. **Refund Handling**
   - Test pre-payout refunds
   - Test post-payout refunds
   - Verify commission handling on refunds
   - Test dispute processing

#### Success Criteria:
- ✅ Automated payouts working
- ✅ Error handling robust
- ✅ Refund system functional
- ✅ Audit trail complete

## 🔧 Critical Gaps to Address

### High Priority (Must Fix for MVP)
1. **Idempotency Protection** (Low Effort)
   - Add idempotency keys to prevent duplicate payments
   - Critical for production reliability

2. **Basic Audit Logging** (Low Effort)
   - Log all payment operations
   - Essential for debugging and compliance

3. **Webhook Error Handling** (Medium Effort)
   - Add retry logic for failed webhooks
   - Prevent data inconsistencies

### Medium Priority (Should Fix)
4. **Automated Payout Scheduling** (Medium Effort)
   - Currently manual, needs automation
   - Core business requirement

5. **Comprehensive Refund Logic** (High Effort)
   - Handle pre/post payout refunds
   - Complex but necessary for disputes

## 📊 Current Status

### ✅ Completed
- Database schema designed and ready
- Payment processing API implemented
- Credit system API implemented
- Payout system API implemented
- Webhook handlers created
- Commission calculation logic (18% added to instructor rate)
- Discount and referral system
- Basic refund tracking

### 🟡 In Progress
- Stripe account setup
- Webhook configuration
- Testing and validation

### 🔴 Not Started
- Idempotency protection
- Audit logging
- Automated payout scheduling
- Comprehensive error handling
- Production monitoring

## 🎯 Next Steps

### Immediate (Today)
1. **Set up Stripe Connect** in your business account
2. **Create webhook endpoints** for Connect and Payment events
3. **Get API keys** and update environment variables

### This Week
1. **Run database schema** in Supabase
2. **Test basic payment flow** with Stripe test cards
3. **Verify commission calculations** are correct

### Next Week
1. **Implement automated payouts**
2. **Add idempotency protection**
3. **Add basic audit logging**

## 🚨 Important Notes

### Commission Model
- **18% commission is ADDED to instructor's rate** (not deducted)
- Example: Instructor lists £30/hour → Learner pays £35.40 → Instructor receives £30
- This ensures instructors get their full listed rate

### Payout Schedule
- **Friday payouts** (7 days after lesson completion)
- Example: Lesson completed Oct 9th → Payout Oct 17th
- Automated processing with retry logic

### Security Considerations
- Use existing business Stripe account
- Implement webhook signature verification
- Add idempotency protection
- Maintain audit trail for all operations

## 📞 Support Resources

- **Stripe Connect Documentation**: https://stripe.com/docs/connect
- **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
- **Supabase Documentation**: https://supabase.com/docs
- **Project Files**: All implementation files created and ready

## 🔄 Resuming Work

When you return to this project:

1. **Check current phase** status above
2. **Review completed tasks** in the status section
3. **Start with next immediate steps** listed
4. **Test existing functionality** before adding new features
5. **Refer to this brief** for context and requirements

---

**Last Updated**: January 2025  
**Project Status**: Phase 1 - Foundation Setup  
**Next Milestone**: Complete Stripe account setup and basic testing
