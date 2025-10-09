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

**Tech Stack:** Next.js 15, TypeScript, TailwindCSS, Supabase (Postgres + Auth + Storage)

**Core Features:**
- Instructor search by postcode/distance/vehicle type
- Booking system with availability calendar
- Profile management with photo uploads
- Social proof system (learner certificate uploads)
- Role-based authentication (learner vs instructor)

**Current Focus Areas:**
- Social proof carousel displaying learner success stories
- Certificate upload system for learners
- Database schema for social_proof_submissions table

### 🔍 **Key Areas to Investigate:**

1. **Social Proof System**
   - Check if learner names are displaying correctly (not "Learner")
   - Verify certificate images are loading
   - Test upload functionality

2. **Database Schema**
   - Verify social_proof_submissions table exists
   - Check RLS policies for storage buckets
   - Confirm test data is properly linked

3. **UI/UX Status**
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

- Learner names showing as "Learner" instead of actual names
- Build errors in bookings page
- Supabase connection issues
- Image upload/storage problems
- Authentication/authorization issues

### 📁 **Important File Locations:**

- `README.md` - Project documentation
- `src/app/page.tsx` - Homepage with instructor carousel
- `src/components/ui/SocialProofCarousel.tsx` - Social proof display
- `src/components/ui/SocialProofSubmissionForm.tsx` - Certificate upload
- `src/app/bookings/page.tsx` - Learner booking management
- `database-setup-social-proof.sql` - Database schema
- `BUG-SOCIAL-PROOF-LEARNER-NAMES.md` - Known issue documentation

---

**Please run these diagnostics and provide a comprehensive project status report. Focus on identifying any issues that need immediate attention and provide actionable next steps.**
