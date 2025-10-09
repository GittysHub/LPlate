# 🎯 Stripe Connect Setup Guide for LPlate Marketplace

This guide will walk you through setting up Stripe Connect for your LPlate marketplace, enabling payments between learners and driving instructors with automated Friday payouts.

## 📋 Prerequisites

- Stripe account (sign up at [stripe.com](https://stripe.com))
- Supabase project with the provided database schema
- LPlate project with the new Stripe integration files

## 🚀 Step-by-Step Setup

### 1. Stripe Account Setup

1. **Create Stripe Account**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Complete account verification
   - Enable Stripe Connect in your dashboard

2. **Get API Keys**
   - Go to Developers → API Keys
   - Copy your **Publishable key** (pk_test_...)
   - Copy your **Secret key** (sk_test_...)

3. **Create Webhook Endpoints**
   - Go to Developers → Webhooks
   - Create two webhook endpoints:

   **Webhook 1: Connect Events**
   - URL: `https://yourdomain.com/api/webhooks/stripe-connect`
   - Events: `account.updated`, `account.application.deauthorized`, `transfer.created`, `transfer.updated`
   - Copy the webhook secret (whsec_...)

   **Webhook 2: Payment Events**
   - URL: `https://yourdomain.com/api/webhooks/stripe-payments`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `charge.refunded`
   - Copy the webhook secret (whsec_...)

### 2. Environment Configuration

Add these variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secrets
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_your_connect_webhook_secret
STRIPE_PAYMENTS_WEBHOOK_SECRET=whsec_your_payments_webhook_secret

# Platform Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Database Setup

Run the provided SQL schema in your Supabase SQL editor:

```sql
-- Run the contents of stripe-connect-schema.sql
-- This creates all necessary tables for payments, credits, and payouts
```

### 4. Install Dependencies

```bash
pnpm install stripe@^16.0.0
```

### 5. Test the Integration

1. **Test Account Creation**
   ```bash
   curl -X POST http://localhost:3000/api/stripe-connect/account \
     -H "Content-Type: application/json" \
     -d '{"instructorId": "your-instructor-id"}'
   ```

2. **Test Payment Processing**
   ```bash
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{
       "learnerId": "learner-id",
       "instructorId": "instructor-id",
       "amountPence": 3000,
       "paymentMethodId": "pm_card_visa"
     }'
   ```

## 💰 Payment Flow Overview

### Learner Payment Process

1. **Lesson Booking**: Learner books a lesson with an instructor
2. **Pricing**: Learner pays instructor's listed rate + 18% platform fee
3. **Payment**: Learner pays total amount through Stripe
4. **Commission**: Platform keeps 18% commission automatically
5. **Instructor Payment**: Instructor receives their full listed rate
6. **Payout**: Instructor receives payout on Friday after lesson completion

**Example**: Instructor lists £30/hour → Learner pays £35.40 (£30 + £5.40 platform fee) → Instructor receives £30

### Credit System

1. **Credit Purchase**: Learners can prepay for multiple hours
2. **Credit Storage**: Credits are tied to specific instructors
3. **Automatic Deduction**: Hours are deducted as lessons are completed
4. **Balance Tracking**: Real-time credit balance updates

### Payout Schedule

- **Lesson Completion**: Lesson completed on any day
- **Payout Date**: Following Friday (e.g., lesson Oct 9th → payout Oct 17th)
- **Automatic Processing**: Payouts processed automatically via cron job
- **Commission**: Platform keeps 18% commission (added to instructor's rate, not deducted from it)

## 🔧 API Endpoints

### Stripe Connect Account Management

- `POST /api/stripe-connect/account` - Create Connect account
- `GET /api/stripe-connect/account?instructorId=...` - Get account status
- `PUT /api/stripe-connect/account` - Create login link

### Payment Processing

- `POST /api/payments` - Process lesson payment
- `GET /api/payments?paymentId=...` - Get payment status

### Credit Management

- `GET /api/credits?learnerId=...` - Get credit balance
- `POST /api/credits` - Use credits for booking
- `PUT /api/credits` - Purchase additional credits

### Payout Management

- `POST /api/payouts` - Process Friday payouts
- `GET /api/payouts?instructorId=...` - Get payout history

## 🎯 Key Features Implemented

### ✅ Payment Processing
- Stripe Connect Express accounts for instructors
- 18% platform commission automatically calculated
- Support for cards, bank transfers, and other payment methods
- Real-time payment status updates

### ✅ Credit System
- Prepaid lesson credits tied to specific instructors
- Automatic hour deduction as lessons are completed
- Real-time balance tracking
- Credit expiration support

### ✅ Automated Payouts
- Friday payout schedule (7 days after lesson completion)
- Automatic transfer to instructor Stripe accounts
- Payout history and tracking
- Failed payout handling

### ✅ Discount & Referral System
- Discount code support (percentage or fixed amount)
- Referral code tracking
- Usage limits and expiration dates
- Commission calculation with discounts

### ✅ Dispute Resolution
- Automatic dispute detection
- Refund processing with proper commission handling
- Payment status tracking
- Admin notification system

## 🔒 Security Features

- Webhook signature verification
- Row Level Security (RLS) policies
- Encrypted sensitive data storage
- Secure API key management
- Payment method tokenization

## 📊 Monitoring & Analytics

- Payment success/failure tracking
- Payout status monitoring
- Credit usage analytics
- Commission revenue tracking
- Dispute and refund reporting

## 🚨 Error Handling

- Comprehensive error logging
- Graceful failure handling
- Retry mechanisms for failed operations
- User-friendly error messages
- Admin alert system

## 🔄 Webhook Events

### Connect Events
- `account.updated` - Account status changes
- `account.application.deauthorized` - Account disconnected
- `transfer.created` - Payout initiated
- `transfer.updated` - Payout status changes

### Payment Events
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.dispute.created` - Dispute initiated
- `charge.refunded` - Refund processed

## 📈 Scaling Considerations

- Database indexing for performance
- Webhook retry mechanisms
- Rate limiting for API endpoints
- Caching for frequently accessed data
- Monitoring and alerting setup

## 🆘 Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Check webhook secret in environment variables
   - Verify webhook URL is accessible
   - Ensure correct event types are selected

2. **Payment Intent Creation Failed**
   - Verify Stripe API keys are correct
   - Check instructor Connect account is active
   - Ensure sufficient funds for platform fee

3. **Payout Processing Failed**
   - Verify instructor account has payouts enabled
   - Check payout schedule configuration
   - Ensure transfer amounts are valid

### Support Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Documentation](https://supabase.com/docs)

## 🎉 Next Steps

1. **Test in Development**: Use Stripe test mode to verify all functionality
2. **Go Live**: Switch to live mode when ready for production
3. **Monitor**: Set up monitoring and alerting for production
4. **Optimize**: Monitor performance and optimize as needed

---

**Built with ❤️ for the LPlate marketplace**
