-- Social Proof Submissions Table
-- This table stores learner-submitted certificate photos and testimonials

CREATE TABLE social_proof_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id uuid REFERENCES profiles(id) NOT NULL,
  instructor_id uuid REFERENCES instructors(id) NOT NULL,
  certificate_image_url text NOT NULL,
  test_date date NOT NULL,
  test_location text NOT NULL,
  testimonial text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_social_proof_learner ON social_proof_submissions(learner_id);
CREATE INDEX idx_social_proof_instructor ON social_proof_submissions(instructor_id);
CREATE INDEX idx_social_proof_status ON social_proof_submissions(status);

-- Enable RLS
ALTER TABLE social_proof_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Learners can view their own submissions
CREATE POLICY "Learners can view own submissions" ON social_proof_submissions 
  FOR SELECT USING (auth.uid() = learner_id);

-- Learners can insert their own submissions
CREATE POLICY "Learners can create submissions" ON social_proof_submissions 
  FOR INSERT WITH CHECK (auth.uid() = learner_id);

-- Learners can update their own pending submissions
CREATE POLICY "Learners can update own pending submissions" ON social_proof_submissions 
  FOR UPDATE USING (auth.uid() = learner_id AND status = 'pending');

-- Public can view approved submissions
CREATE POLICY "Public can view approved submissions" ON social_proof_submissions 
  FOR SELECT USING (status = 'approved');

-- Instructors can view submissions for their students
CREATE POLICY "Instructors can view student submissions" ON social_proof_submissions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instructors 
      WHERE instructors.id = instructor_id 
      AND instructors.id = auth.uid()
    )
  );

-- Using existing 'avatars' bucket for social proof images
-- The avatars bucket should already be configured with public access
-- File size limit: 5MB
-- Allowed file types: jpg, jpeg, png, webp

-- Storage policies for avatars bucket (for social proof)
-- Allow authenticated users to upload certificates to avatars bucket
CREATE POLICY "Authenticated users can upload certificates to avatars" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Allow public to view certificates in avatars bucket
CREATE POLICY "Public can view certificates in avatars" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'avatars'
  );

-- Allow users to update their own certificate uploads
CREATE POLICY "Users can update own certificates in avatars" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own certificate uploads
CREATE POLICY "Users can delete own certificates in avatars" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
