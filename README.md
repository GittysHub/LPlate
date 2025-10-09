# 🚗 L Plate - Learner Driver Marketplace

A modern marketplace web app connecting UK learner drivers with qualified driving instructors. Built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

### 🎯 Core Functionality
- **Instructor Search**: Find instructors by postcode, distance, vehicle type, gender, and availability
- **Profile Management**: Instructors can manage their profiles with photos, descriptions, and rates
- **Booking System**: Learners can request lessons and instructors can manage bookings
- **Availability Calendar**: Instructors can set their weekly availability schedule
- **Real-time Filtering**: Search results filtered by instructor availability and preferences
- **Social Proof System**: Learners can upload driving test certificates to showcase success stories

### 🎨 Modern UI/UX
- **Apple-inspired design system** with Poppins font and clean aesthetics
- **Mobile-first responsive layout** optimized for all device sizes
- **iOS 7 style toggle switches** for availability management with green/red color coding
- **Horizontal instructor carousel** with 295px uniform cards and smooth scrolling
- **Modern card designs** with shadows, hover effects, and optimized spacing
- **Hamburger menu navigation** with role-based dropdown menus
- **Enhanced search bar** with shadows and interactive hover states
- **3-step journey visualization** with animated icons and connecting arrows
- **Custom logo system** with fallback mechanism for reliable branding
- **Streamlined authentication** with pill-shaped role selection and confirmation screens
- **Social media integration** with playful footer-style links and brand-colored buttons
- **Optimized homepage flow** with strategic section placement for better conversion
- **Social proof carousel** displaying learner success stories with certificate images
- **Certificate upload system** for learners to share their driving test achievements

### 🔐 Authentication & Security
- **Supabase Auth** for secure user authentication
- **Row Level Security (RLS)** protecting user data
- **Role-based access** (learner vs instructor)
- **Profile photo uploads** to Supabase Storage

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS |
| **Backend** | Supabase (Postgres + Auth + Storage) |
| **Authentication** | Supabase Auth |
| **Database** | PostgreSQL with geolocation support |
| **File Storage** | Supabase Storage |
| **Styling** | TailwindCSS with custom components |
| **Fonts** | Poppins (Google Fonts) |

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── sign-in/           # Authentication pages
│   ├── auth/
│   │   └── callback/          # Auth callback handling
│   ├── booking/
│   │   └── request/           # Booking request flow
│   ├── instructor/
│   │   ├── profile/           # Instructor profile management
│   │   ├── availability/     # Weekly availability calendar
│   │   ├── bookings/         # Instructor's booking management
│   │   └── layout.tsx        # Instructor-specific layout
│   ├── search/               # Learner search page
│   ├── bookings/             # Learner's booking management
│   ├── layout.tsx            # Root layout with navigation
│   └── page.tsx              # Homepage
├── components/
│   ├── Navigation.tsx         # Global navigation component
│   └── ui/                    # Reusable UI components
│       ├── SearchBar.tsx      # Enhanced search input
│       ├── FilterChips.tsx    # Filter selection chips
│       ├── InstructorCard.tsx # Instructor display card
│       ├── StatCard.tsx      # Statistics display card
│       ├── ProgressBar.tsx    # Progress visualization
│       ├── ToggleSwitch.tsx   # iOS 7 style toggle
│       └── SocialProofCarousel.tsx # Certificate showcase carousel
└── lib/
    ├── supabase.ts           # Client-side Supabase client
    ├── supabase-browser.ts   # Browser-specific client
    └── supabase-server.ts    # Server-side client
```

## 🗄 Database Schema

### Key Tables

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, matches Supabase user ID |
| `name` | text | User's display name |
| `role` | text | 'learner' or 'instructor' |
| `postcode` | text | UK postcode for location |
| `phone` | text | Contact phone number |
| `email` | text | Contact email |
| `avatar_url` | text | Profile photo URL |

#### `instructors`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Foreign key to profiles.id |
| `description` | text | Instructor bio/description |
| `gender` | text | 'male', 'female', 'other' |
| `base_postcode` | text | Primary service area |
| `vehicle_type` | text | 'manual', 'auto', 'both' |
| `hourly_rate` | numeric | Price per hour |
| `adi_badge` | boolean | ADI qualification status |
| `verification_status` | text | 'pending', 'approved', 'rejected' |
| `lat` | float8 | Latitude for distance calculation |
| `lng` | float8 | Longitude for distance calculation |

#### `bookings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `learner_id` | uuid | Foreign key to profiles.id |
| `instructor_id` | uuid | Foreign key to instructors.id |
| `start_at` | timestamptz | Lesson start time |
| `end_at` | timestamptz | Lesson end time |
| `price` | numeric | Total lesson cost |
| `note` | text | Learner's special requests |
| `status` | text | 'pending', 'confirmed', 'cancelled', 'completed' |

#### `availability`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `instructor_id` | uuid | Foreign key to instructors.id |
| `start_at` | timestamptz | Availability start time |
| `end_at` | timestamptz | Availability end time |
| `is_recurring` | boolean | Weekly recurring slot |
| `created_at` | timestamptz | Record creation time |

#### `social_proof_submissions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `learner_id` | uuid | Foreign key to profiles.id |
| `instructor_id` | uuid | Foreign key to instructors.id |
| `certificate_image_url` | text | URL to uploaded certificate image |
| `test_date` | date | Date of driving test |
| `test_location` | text | Test centre location |
| `testimonial` | text | Optional learner testimonial |
| `status` | text | 'pending', 'approved', 'rejected' |
| `created_at` | timestamptz | Submission timestamp |
| `updated_at` | timestamptz | Last update timestamp |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
git clone <your-repo-url>
cd lplate
   ```

2. **Install dependencies**
   ```bash
pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
```bash
pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Supabase Setup

1. **Create a new Supabase project**
2. **Run the database migrations** (see Database Setup below)
3. **Set up Storage bucket** named "avatars" for profile photos
4. **Configure RLS policies** for data security

## 🗃 Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('learner', 'instructor')),
  postcode text,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create instructors table
CREATE TABLE instructors (
  id uuid REFERENCES profiles(id) PRIMARY KEY,
  description text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  base_postcode text,
  vehicle_type text CHECK (vehicle_type IN ('manual', 'auto', 'both')),
  hourly_rate numeric,
  adi_badge boolean DEFAULT false,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  lat float8,
  lng float8,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES profiles(id),
  instructor_id uuid REFERENCES instructors(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  price numeric NOT NULL,
  note text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create availability table
CREATE TABLE availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid REFERENCES instructors(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_instructors_location ON instructors(lat, lng);
CREATE INDEX idx_instructors_status ON instructors(verification_status);
CREATE INDEX idx_bookings_learner ON bookings(learner_id);
CREATE INDEX idx_bookings_instructor ON bookings(instructor_id);
CREATE INDEX idx_availability_instructor ON availability(instructor_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies (add your specific policies here)
-- Example: Users can only read/write their own profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

## 🎯 Key Features Implemented

### ✅ Completed Features
- **Apple-Inspired Design System**: Complete UI overhaul with modern aesthetics and Poppins font
- **Homepage Redesign**: Optimized section flow with hero, journey steps, instructor carousel, stats, and social proof
- **Enhanced Search Interface**: Modern filter chips, uniform instructor cards, and real-time filtering
- **iOS 7 Toggle Switches**: Forest green (available) and dark red (busy) color scheme
- **Hamburger Menu Navigation**: Clean dropdown navigation for authenticated users
- **Instructor Carousel**: Horizontal scrolling with 295px uniform cards and proper spacing
- **Profile Photo Management**: Enhanced avatar display with fallback initials and Supabase Storage
- **Booking System**: Complete booking request and management flow
- **Availability Calendar**: Weekly availability management with modern toggles
- **My Bookings Pages**: Separate management interfaces for learners and instructors
- **Authentication**: Streamlined login/signup with Apple-inspired design and role selection
- **Mobile-First Design**: Optimized responsive design with proper text sizing
- **Logo System**: Custom logo component with reliable fallback mechanism
- **Database Optimization**: Fixed performance issues and reduced excessive API requests
- **Social Media Integration**: Footer-style social links with brand colors and hover animations
- **Homepage Flow Optimization**: Strategic section placement for improved user journey and conversion

### 🔄 Latest Updates (v2.5)
- **Homepage Structure Optimization**: Reorganized sections for better user flow and conversion
- **Stats Section Placement**: Moved "We've got you covered" stats right after instructor showcase for better social proof timing
- **Social Media Integration**: Added playful social media links at bottom of homepage with Instagram, TikTok, and Twitter
- **Content Cleanup**: Removed redundant text from qualified learners section for cleaner presentation
- **Enhanced User Journey**: Improved section flow from instructors → stats → social proof → final CTA
- **Footer-Style Social Links**: Social media section now serves as effective footer element
- **Mobile-First Social Design**: Responsive social buttons with hover animations and brand colors
- **Improved Conversion Flow**: Better logical progression through homepage sections

## 🌐 Deployment Status

### ✅ Production Deployment
- **Platform**: Vercel
- **Status**: Successfully deployed and accessible
- **Environment**: Production with Supabase backend
- **URL**: Available through Vercel dashboard

### 🔧 Deployment Configuration
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Framework**: Next.js 15
- **Environment Variables**: Configured for Supabase connection

## 🚧 Roadmap

### 🔜 Next Features
- **Learner Dashboard**: Progress tracking and lesson history
- **Instructor Dashboard**: Earnings, student management, and analytics
- **Payment Integration**: Stripe payment processing
- **Email Notifications**: Booking confirmations and updates
- **Advanced Scheduling**: Recurring lesson bookings
- **Reviews & Ratings**: Instructor feedback system
- **Mobile App**: React Native version

### 🛠 Technical Improvements
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: Image optimization and lazy loading
- **Testing**: Unit and integration test coverage
- **Analytics**: User behavior tracking and insights
- **Accessibility**: WCAG compliance and screen reader support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@lplate.com or create an issue in this repository.

---

**Built with ❤️ for UK learner drivers and instructors**
