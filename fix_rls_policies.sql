-- Quick fix for RLS policy infinite recursion issue
-- Run this in Supabase SQL Editor

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Leaders can view commitments in their org" ON commitments;
DROP POLICY IF EXISTS "Users can manage their own commitments" ON commitments;
DROP POLICY IF EXISTS "Leaders can view commitments" ON commitments;

-- Recreate simpler, non-recursive policies
CREATE POLICY "Users can manage their own commitments" ON commitments
  FOR ALL USING (auth.uid() = user_id);

-- Simple policy for leaders - no complex joins that could cause recursion
CREATE POLICY "Leaders can view all commitments" ON commitments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_leader = true
    )
  );

-- Also ensure we have basic policies for other tables
DROP POLICY IF EXISTS "Anyone can view active needs" ON needs;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Anyone can view active needs" ON needs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
