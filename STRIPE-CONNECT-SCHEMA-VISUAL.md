# LPlate Stripe Connect Database Schema

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string name
        timestamp created_at
        timestamp updated_at
    }
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        string name
        string email
        string phone
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    INSTRUCTORS {
        uuid id PK
        uuid user_id FK
        decimal hourly_rate_pence
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    STRIPE_CONNECT_ACCOUNTS {
        uuid id PK
        uuid instructor_id FK
        string stripe_account_id
        string account_type
        string status
        boolean charges_enabled
        boolean payouts_enabled
        string country
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid learner_id FK
        uuid instructor_id FK
        string stripe_payment_intent_id
        integer total_amount_pence
        integer platform_fee_pence
        integer instructor_amount_pence
        string status
        string payment_type
        timestamp created_at
        timestamp updated_at
    }
    
    LEARNER_CREDITS {
        uuid id PK
        uuid learner_id FK
        uuid instructor_id FK
        integer hours_purchased
        integer hours_used
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PAYOUTS {
        uuid id PK
        uuid instructor_id FK
        string stripe_transfer_id
        integer amount_pence
        string status
        date payout_date
        timestamp created_at
        timestamp updated_at
    }
    
    DISCOUNT_CODES {
        uuid id PK
        string code
        integer discount_percentage
        integer max_uses
        integer uses_count
        date expires_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    REFERRAL_CODES {
        uuid id PK
        string code
        uuid referrer_id FK
        integer discount_percentage
        integer max_uses
        integer uses_count
        date expires_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    REFUNDS {
        uuid id PK
        uuid payment_id FK
        string stripe_refund_id
        integer amount_pence
        string reason
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        string entity_type
        uuid entity_id
        string action
        json old_values
        json new_values
        uuid user_id FK
        timestamp created_at
    }
    
    RECONCILIATION_REPORTS {
        uuid id PK
        date report_date
        integer total_revenue_pence
        integer total_payouts_pence
        integer total_fees_pence
        json payment_breakdown
        json payout_breakdown
        timestamp created_at
    }

    USERS ||--o{ PROFILES : "has"
    USERS ||--o{ INSTRUCTORS : "can_be"
    INSTRUCTORS ||--|| STRIPE_CONNECT_ACCOUNTS : "has"
    INSTRUCTORS ||--o{ PAYMENTS : "receives"
    INSTRUCTORS ||--o{ LEARNER_CREDITS : "provides"
    INSTRUCTORS ||--o{ PAYOUTS : "receives"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ LEARNER_CREDITS : "owns"
    USERS ||--o{ REFERRAL_CODES : "creates"
    PAYMENTS ||--o{ REFUNDS : "can_have"
    USERS ||--o{ AUDIT_LOGS : "performs"
```

## Key Relationships Explained

### 1. **User Management**
- `USERS` → `PROFILES` (1:many) - Users can have multiple profiles
- `USERS` → `INSTRUCTORS` (1:many) - Users can be instructors

### 2. **Stripe Connect**
- `INSTRUCTORS` → `STRIPE_CONNECT_ACCOUNTS` (1:1) - Each instructor has one Stripe account
- `STRIPE_CONNECT_ACCOUNTS` stores Stripe-specific data (account ID, status, capabilities)

### 3. **Payment Flow**
- `USERS` → `PAYMENTS` (1:many) - Users make multiple payments
- `INSTRUCTORS` → `PAYMENTS` (1:many) - Instructors receive multiple payments
- `PAYMENTS` stores the 18% commission logic (platform_fee_pence)

### 4. **Credit System**
- `USERS` → `LEARNER_CREDITS` (1:many) - Users can have credits with multiple instructors
- `INSTRUCTORS` → `LEARNER_CREDITS` (1:many) - Instructors can have credits from multiple learners
- Credits are tied to specific instructor-learner pairs

### 5. **Payouts**
- `INSTRUCTORS` → `PAYOUTS` (1:many) - Instructors receive multiple payouts
- Automated Friday payout system

### 6. **Discounts & Referrals**
- `DISCOUNT_CODES` - Platform-wide discount codes
- `REFERRAL_CODES` - User-created referral codes with referrer tracking

### 7. **Audit & Reconciliation**
- `AUDIT_LOGS` - Tracks all changes for compliance
- `RECONCILIATION_REPORTS` - Financial reporting and reconciliation

## Commission Model
- **Learner pays:** `total_amount_pence` (instructor rate + 18% platform fee)
- **Platform keeps:** `platform_fee_pence` (18% of instructor rate)
- **Instructor receives:** `instructor_amount_pence` (full instructor rate)
