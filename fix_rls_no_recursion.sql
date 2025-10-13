-- COMPREHENSIVE FIX: RLS policies without recursion
-- Run this after the emergency fix

-- This approach avoids recursion by using simpler policies
-- and handling leader access through application logic or service role

-- 1. Ensure we have the basic user policies (from emergency fix)
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile  
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Add a simple policy for authenticated users to view profiles
-- This allows basic profile viewing without complex leader logic
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. For leader functionality, we'll handle it in the application layer
-- or use service role for admin operations

-- 4. Verify all policies
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

-- 5. Test basic operations
-- Users should now be able to:
-- - View their own profile
-- - Insert their own profile (for new users)
-- - Update their own profile
-- - View other profiles (for leader functionality)
