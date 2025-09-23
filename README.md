📝 L Plate Project – README for Context Sharing
1. Project Overview

Goal:
A marketplace web app connecting UK learner drivers with driving instructors.

Focus on simplicity, Apple-like clean UI, and usability for instructors, including older, less tech-savvy users.

Core features include:

Instructor onboarding and profiles

Search for instructors by postcode, distance, vehicle type, and gender

Booking requests between learners and instructors

Future integrations: Stripe payments, lesson scheduling, and notifications.

Current Status:

MVP development in progress

Search functionality works (with distance calculation and filters)

Booking flow functional (can create bookings in DB)

Instructor profiles implemented with geolocation support

UI currently minimal, styling improvements needed.

2. Tech Stack
Layer	Tech
Frontend	Next.js 15, TypeScript, TailwindCSS
Backend	Supabase (Postgres + Auth + Storage)
Authentication	Supabase Auth
Payments	Stripe (planned, not yet implemented)
Hosting	Vercel (frontend), Supabase (backend)
3. Architecture Overview
Next.js App
  ├─ /src
  │   ├─ /app
  │   │   ├─ /auth            -> Sign-in and callback routes
  │   │   ├─ /search          -> Learner search page
  │   │   ├─ /booking/request -> Booking request flow
  │   │   ├─ /instructor
  │   │   │   ├─ profile      -> Instructor profile management
  │   │   │   └─ availability -> Manage availability slots
  │   │   └─ layout.tsx       -> Shared layouts
  │   │
  │   └─ /lib
  │       ├─ supabase.ts        -> Supabase client setup
  │       ├─ supabase-browser.ts-> Browser-side Supabase client
  │       └─ supabase-server.ts -> Server-side Supabase client
  │
  └─ /public                     -> Static assets


Supabase Usage:

Auth: Instructors and learners log in via Supabase Auth.

RLS (Row Level Security): Protects tables so users can only read/write their own data.

Database: Postgres with geolocation-enabled search.

4. Database Schema (Key Tables)
profiles
Column	Type	Notes
id	uuid	PK, matches Supabase user id
name	text	Instructor or learner name
role	text	'learner' or 'instructor'
postcode	text	UK postcode
phone	text	Optional
instructors
Column	Type	Notes
id	uuid	FK → profiles.id
description	text	
gender	text	'male', 'female', 'other'
base_postcode	text	Used for search
vehicle_type	text	'manual', 'auto', 'both'
hourly_rate	numeric	e.g., 30.00
adi_badge	boolean	
verification_status	text	'pending', 'approved', 'rejected'
lat	float8	Latitude, calculated via postcode API
lng	float8	Longitude, calculated via postcode API
bookings
Column	Type	Notes
id	uuid	PK
learner_id	uuid	FK → profiles.id
instructor_id	uuid	FK → instructors.id
start_at	timestamptz	Lesson start time
end_at	timestamptz	Lesson end time
price	numeric	Calculated based on hourly rate and duration
note	text	Optional learner note
status	text	ENUM: 'pending', 'confirmed', 'cancelled'
5. Known Issues / Current Blockers

 Booking request initially failed due to missing note column – fixed today.

 Booking request failed due to status mismatch – fixed by setting default status to pending.

 Search page works but UI is very basic and needs redesign for usability.

 Git Bash terminal occasionally locks up after nano, requiring restart.

 Instructor availability feature not yet functional (UI present, no backend logic).

 No booking notifications implemented yet.

6. Next Steps

Immediate Priority:

Improve UI for search and instructor profile pages.

Add validation for booking inputs.

Create a "My Bookings" page for both learners and instructors.

Upcoming Features:

Instructor availability calendar logic.

Stripe payment integration.

Email notifications via Supabase Functions or external service.

Technical Improvements:

Add better error handling on frontend for Supabase calls.

Improve Supabase RLS policies to handle bookings more securely.

7. How to Run the Project
# 1. Clone the repo
git clone <your-repo-url>
cd lplate

# 2. Install dependencies
pnpm install

# 3. Run dev server
pnpm dev

# 4. Access app
http://localhost:3000


Environment Variables Required (.env.local):

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

8. Session Summary

Date: 2025-09-23

What we achieved today:

Added instructor profile creation with geolocation support.

Built learner search page with filters for vehicle type, gender, and distance.

Built booking request page:

Learners can send a booking request to an instructor.

Fixed database schema issues (note column, status constraint).

Verified end-to-end flow works:

Instructor appears in search.

Booking request is saved in database with status "pending".

Open questions:

How to structure notifications for booking requests?

What fields are required for Stripe integration?

-------------- Legacy README ------------------------


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
