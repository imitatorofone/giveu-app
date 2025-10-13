-- Complete fix for profiles table RLS policies and schema
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Leaders can view profiles in their org" ON profiles;

-- 2. Create comprehensive RLS policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (this was missing!)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Leaders can view profiles in their church (updated to use church_code)
CREATE POLICY "Leaders can view profiles in their church" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.church_code = profiles.church_code 
      AND p.is_leader = true
    )
  );

-- 3. Ensure all required columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 4. Verify policies exist
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- 5. Test the policies work
-- This should show all policies for the profiles table
