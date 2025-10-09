# LPlate Project Diagnostic Prompt

Use this prompt when starting a new Cursor session to quickly get up to speed on the LPlate project:

---

## 🚗 LPlate Project Diagnostic & Context Setup

I'm working on **LPlate**, a UK learner driver marketplace connecting learners with qualified driving instructors. Please help me get up to speed by running these diagnostics and providing a comprehensive project overview.

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
- **Stripe Connect Integration**: Payment processing, automated payouts, and webhook handling
- **Payment System**: Lesson payments, credit purchases, and commission management
- **TypeScript Error Resolution**: Fixing remaining build issues for production deployment
- **Database Schema**: Stripe Connect tables and payment tracking
- **Webhook Processing**: Real-time payment updates and account status changes
- Enhanced instructor search functionality with modern UI/UX
- Advanced filtering system with segmented toggles
- Privacy protection and user experience improvements

### 🔍 **Key Areas to Investigate:**

1. **Stripe Connect Integration**
   - Check webhook endpoints are deployed and responding
   - Verify Stripe Connect account creation flow
   - Test payment processing with test cards
   - Confirm automated payout system is working
   - Check commission calculation (18% added to instructor rate)
   - Verify prepaid credit system functionality
   - Test discount and referral code application
   - Check dispute and refund handling

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

**Stripe Connect Issues:**
- Webhook endpoints returning 404 (check deployment)
- TypeScript build errors preventing deployment
- Stripe API key configuration issues
- Webhook signature verification failures
- Payment processing errors
- Commission calculation incorrect (should be 18% added, not deducted)
- Instructor payout failures
- Credit system not deducting hours properly

**Existing Issues:**
- Instructor names showing as "Instructor" instead of actual names (FIXED)
- Profile pictures not loading (showing initials instead)
- Postcode normalization not working properly (FIXED)
- Filter toggles not responding correctly
- Price sorting not working (should be lowest first) (FIXED)
- Enter key not triggering search (FIXED)
- Distance showing in km instead of miles (FIXED)
- Postcodes not being masked for privacy (FIXED)
- Homepage search requiring double-typing (FIXED)
- Service radius filtering not working (check database migration applied)
- Instructors not appearing in search results (check service_radius_miles values)
- Learner names showing as "Learner" instead of actual names
- Build errors in bookings page
- Supabase connection issues
- Image upload/storage problems
- Authentication/authorization issues

### 📁 **Important File Locations:**

**Stripe Connect Files:**
- `src/lib/stripe.ts` - Stripe configuration and utilities
- `src/app/api/stripe-connect/account/route.ts` - Account management
- `src/app/api/payments/route.ts` - Payment processing
- `src/app/api/payouts/route.ts` - Automated payout system
- `src/app/api/credits/route.ts` - Prepaid credit management
- `src/app/api/webhooks/stripe-connect/route.ts` - Connect webhooks
- `src/app/api/webhooks/stripe-payments/route.ts` - Payment webhooks
- `stripe-connect-schema.sql` - Payment database schema
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
