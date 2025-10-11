# LPlate Project Diagnostic Prompt

Use this prompt when starting a new Cursor session to quickly get up to speed on the LPlate project:

---

## 🚗 LPlate Project Diagnostic & Context Setup

I'm working on **LPlate**, a UK learner driver marketplace connecting learners with qualified driving instructors. **PRODUCTION STATUS: Stripe Connect integration is complete and deployed!** 🎉

### 🎯 **Current Status (Latest)**
- ✅ **Stripe Connect**: Fully integrated with production-ready schema
- ✅ **Database**: ChatGPT-improved schema with concurrency-safe credit ledger
- ✅ **Webhooks**: Deployed and processing events successfully
- ✅ **Build**: All TypeScript and linting issues resolved
- ✅ **Deployment**: Live on Vercel with Stripe Connect functionality

Please help me get up to speed by running these diagnostics and providing a comprehensive project overview.

### 📋 **Immediate Diagnostics to Run:**

1. **Check Project Status**
   - Run `git status` to see current changes
   - Run `git log --oneline -5` to see recent commits
   - Check if dev server is running (`pnpm dev` if needed)

2. **Review Key Files**
   - Read `README.md` for project overview and current features
   - Check `package.json` for dependencies and scripts
   - Review `src/app/page.tsx` for homepage structure
   - Check `src/components/ui/SocialProofCarousel.tsx` for current implementation

3. **Database & Backend Status**
   - Check if Supabase environment variables are configured
   - Review any SQL files in root directory for database setup
   - Check `src/lib/supabase.ts` for client configuration

4. **Known Issues Check**
   - Look for `BUG-*.md` files documenting current issues
   - Check console for any runtime errors
   - Verify social proof system functionality

### 🎯 **Project Context:**

**Tech Stack:** Next.js 15, TypeScript, TailwindCSS, Supabase (Postgres + Auth + Storage), Stripe Connect

**Core Features:**
- Enhanced instructor search with advanced filtering and postcode normalization
- Modern segmented toggle controls for vehicle type, gender, duration, and time of day
- Multi-day availability selection with privacy-protected location display
- Price-sorted results with prominent pricing badges and large profile pictures
- Booking system with availability calendar
- Profile management with photo uploads
- Social proof system (learner certificate uploads)
- Role-based authentication (learner vs instructor)
- **Stripe Connect Integration**: Complete payment processing with automated payouts
- **Prepaid Lesson Credits**: Multi-hour purchases with automatic deduction
- **Discount & Referral Codes**: Promotional code support at checkout

**Current Focus Areas:**
- **Production-Ready Stripe Connect**: Complete payment processing with improved database schema
- **ChatGPT-Improved Schema**: Concurrency-safe credit ledger and clear payout instructions
- **Webhook Integration**: Real-time payment updates using new schema tables (orders, credit_ledger)
- **Database Migration**: Migration script that works with existing LPlate tables
- **TypeScript Build**: All build errors resolved for successful deployment
- **Admin Dashboard**: Materialized views and comprehensive audit trails
- Enhanced instructor search functionality with modern UI/UX
- Advanced filtering system with segmented toggles
- Privacy protection and user experience improvements

### 🔍 **Key Areas to Investigate:**

1. **Production-Ready Stripe Connect Integration**
   - Verify webhook endpoints are deployed and processing events successfully
   - Check new database schema is properly migrated (orders, lessons, credit_ledger, payout_instructions)
   - Test payment processing with improved schema tables
   - Confirm automated Friday payout system with lesson completion tracking
   - Verify concurrency-safe credit ledger system (append-only delta_minutes)
   - Test discount and referral code application
   - Check dispute and refund handling with new schema
   - Verify admin dashboard views and audit trails are working

2. **Enhanced Instructor Search System**
   - Verify postcode normalization is working (handles spaces/no spaces)
   - Test segmented toggle controls for all filter types
   - Check multi-day availability selection functionality
   - Confirm price sorting (lowest first) is working
   - Verify privacy protection (masked postcodes, miles display)
   - Test Enter key support in search bar
   - Verify instant search results from homepage (no double-typing)

2. **Instructor Card Display**
   - Check profile pictures are loading correctly (not just initials)
   - Verify pricing badges are prominent and properly formatted
   - Confirm information hierarchy: Name → Location → Rating → Vehicle Type
   - Test responsive design on mobile devices

3. **Social Proof System**
   - Check if learner names are displaying correctly (not "Learner")
   - Verify certificate images are loading
   - Test upload functionality

4. **Database Schema**
   - Verify social_proof_submissions table exists
   - Check RLS policies for storage buckets
   - Confirm test data is properly linked

5. **UI/UX Status**
   - Verify left/right layout in social proof cards
   - Check date format ("DD Mth")
   - Confirm location names are clean (no "Test Centre")

### 📝 **Expected Output:**

Please provide:
1. **Project Status Summary** - Current state, recent changes, any issues
2. **Feature Status** - What's working, what needs attention
3. **Technical Health** - Build status, dependencies, environment
4. **Next Steps** - Recommended actions or priorities
5. **Known Issues** - Any documented bugs or limitations

### 🚨 **Common Issues to Check:**

**Stripe Connect Issues (RESOLVED):**
- ✅ Webhook endpoints deployed and responding (FIXED)
- ✅ TypeScript build errors resolved (FIXED)
- ✅ Stripe API key configuration working (FIXED)
- ✅ Webhook signature verification working (FIXED)
- ✅ Payment processing with new schema (FIXED)
- ✅ Commission calculation correct (18% added to instructor rate) (FIXED)
- ✅ Instructor payout system implemented (FIXED)
- ✅ Credit system using concurrency-safe ledger (FIXED)

**Database Schema Issues:**
- Database migration not applied (`stripe-connect-migration.sql`)
- Missing Stripe Connect tables (orders, lessons, credit_ledger, payout_instructions)
- Helper functions not installed (`stripe-connect-functions.sql`)

**Existing Issues (Mostly Fixed):**
- ✅ Instructor names showing correctly (FIXED)
- ✅ Profile pictures loading properly (FIXED)
- ✅ Postcode normalization working (FIXED)
- ✅ Filter toggles responding correctly (FIXED)
- ✅ Price sorting working (lowest first) (FIXED)
- ✅ Enter key triggering search (FIXED)
- ✅ Distance showing in miles (FIXED)
- ✅ Postcodes masked for privacy (FIXED)
- ✅ Homepage search working without double-typing (FIXED)
- ✅ Service radius filtering working (FIXED)
- ✅ Learner names displaying correctly (FIXED)
- ✅ Build errors resolved (FIXED)
- ✅ Supabase connection working (FIXED)

### 📁 **Important File Locations:**

**Stripe Connect Files:**
- `src/lib/stripe.ts` - Stripe configuration and utilities
- `src/app/api/stripe-connect/account/route.ts` - Account management
- `src/app/api/payments/route.ts` - Payment processing
- `src/app/api/payouts/route.ts` - Automated payout system
- `src/app/api/credits/route.ts` - Prepaid credit management
- `src/app/api/webhooks/stripe-connect/route.ts` - Connect webhooks
- `src/app/api/webhooks/stripe-payments/route.ts` - Payment webhooks (updated for new schema)
- `stripe-connect-migration.sql` - Database migration script (works with existing tables)
- `stripe-connect-functions.sql` - Helper functions and views
- `stripe-schema-improved.mmd` - Visual schema diagram
- `env-template.txt` - Environment variables template

**Core Application Files:**
- `README.md` - Project documentation with latest updates
- `src/app/page.tsx` - Homepage with instructor carousel
- `src/app/search/page.tsx` - Enhanced instructor search with modern filtering
- `src/components/ui/SearchBar.tsx` - Enhanced search with postcode formatting
- `src/components/ui/ToggleGroup.tsx` - New segmented toggle component
- `src/components/ui/FilterChips.tsx` - Multi-select filter chips
- `src/components/ui/InstructorCard.tsx` - Instructor display card
- `src/components/ui/SocialProofCarousel.tsx` - Social proof display
- `src/components/ui/SocialProofSubmissionForm.tsx` - Certificate upload
- `src/app/bookings/page.tsx` - Learner booking management
- `src/app/instructor/profile/page.tsx` - Instructor profile management with service radius

**Database & Setup Files:**
- `database-setup-social-proof.sql` - Database schema
- `add-service-radius-to-instructors.sql` - Service radius migration
- `update-test-instructors-service-radius.sql` - Test data updates
- `check-current-instructors.sql` - Database debugging queries
- `BUG-SOCIAL-PROOF-LEARNER-NAMES.md` - Known issue documentation

---

**Please run these diagnostics and provide a comprehensive project status report. Focus on identifying any issues that need immediate attention and provide actionable next steps.**
