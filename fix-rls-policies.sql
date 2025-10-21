-- Fix RLS policies for profiles table
-- This script adds the missing INSERT policy and ensures proper access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Also ensure instructors table has proper policies
DROP POLICY IF EXISTS "Users can view own instructor profile" ON instructors;
DROP POLICY IF EXISTS "Users can update own instructor profile" ON instructors;
DROP POLICY IF EXISTS "Users can insert own instructor profile" ON instructors;

CREATE POLICY "Users can view own instructor profile" ON instructors 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own instructor profile" ON instructors 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own instructor profile" ON instructors 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow public read access to approved instructors for search
CREATE POLICY "Public can view approved instructors" ON instructors 
  FOR SELECT 
  USING (verification_status = 'approved');

-- Allow public read access to instructor profiles for search
CREATE POLICY "Public can view instructor profiles" ON profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM instructors 
      WHERE instructors.id = profiles.id 
      AND instructors.verification_status = 'approved'
    )
  );
