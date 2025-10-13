-- EMERGENCY FIX: Resolve infinite recursion in profiles RLS policies
-- Run this in Supabase SQL Editor immediately

-- 1. DISABLE RLS temporarily to stop the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (this stops the recursion)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Leaders can view profiles in their org" ON profiles;
DROP POLICY IF EXISTS "Leaders can view profiles in their church" ON profiles;

-- 3. RE-ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- Users can view their own profile (simple auth.uid() check)
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (simple auth.uid() check)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (simple auth.uid() check)
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. For now, disable leader policies to prevent recursion
-- Leaders will need to be handled differently (via service role or separate queries)
-- We can add these back later with a different approach

-- 6. Verify the policies are working
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

-- 7. Test that basic operations work
-- This should now work without recursion errors
