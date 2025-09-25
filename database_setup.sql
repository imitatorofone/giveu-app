-- Database setup script for the engage application
-- Run this in your Supabase SQL editor

-- Create organizations table
CREATE TABLE IF NOT EXISTS orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),
  full_name TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  age TEXT,
  availability TEXT[],
  gift_selections TEXT[],
  is_leader BOOLEAN DEFAULT FALSE,
  church_code TEXT,
  role TEXT,
  approval_status TEXT DEFAULT 'pending',
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create needs table
CREATE TABLE IF NOT EXISTS needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  address TEXT,
  geographic_location TEXT,
  city TEXT,
  state TEXT,
  organizer_name TEXT,
  organizer_email TEXT,
  status TEXT DEFAULT 'pending',
  giftings_needed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(need_id, user_id)
);

-- Create ministries table
CREATE TABLE IF NOT EXISTS ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_ministries junction table
CREATE TABLE IF NOT EXISTS profile_ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, ministry_id)
);

-- Create profile_leader_notes table
CREATE TABLE IF NOT EXISTS profile_leader_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, leader_id)
);

-- Create feedback_items table
CREATE TABLE IF NOT EXISTS feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Create feedback_attachments table
CREATE TABLE IF NOT EXISTS feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback_items(id) ON DELETE CASCADE,
  file_name TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_leader_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Leaders can view profiles in their org" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.org_id = profiles.org_id 
      AND p.is_leader = true
    )
  );

-- Create RLS policies for needs
CREATE POLICY "Anyone can view active needs" ON needs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Leaders can manage needs in their org" ON needs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.org_id = needs.org_id 
      AND p.is_leader = true
    )
  );

-- Create RLS policies for commitments
CREATE POLICY "Users can manage their own commitments" ON commitments
  FOR ALL USING (auth.uid() = user_id);

-- Simplified policy for leaders to view commitments
CREATE POLICY "Leaders can view commitments" ON commitments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_leader = true
    )
  );

-- Create RLS policies for ministries
CREATE POLICY "Anyone can view active ministries" ON ministries
  FOR SELECT USING (is_active = true);

-- Create RLS policies for profile_ministries
CREATE POLICY "Users can manage their own ministry selections" ON profile_ministries
  FOR ALL USING (auth.uid() = profile_id);

-- Create RLS policies for profile_leader_notes
CREATE POLICY "Leaders can manage notes for profiles in their org" ON profile_leader_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.org_id = (SELECT org_id FROM profiles WHERE id = profile_leader_notes.profile_id)
      AND p.is_leader = true
    )
  );

-- Create RLS policies for feedback
CREATE POLICY "Users can manage their own feedback" ON feedback_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view feedback" ON feedback_items
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON feedback_votes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON feedback_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can view attachments for feedback they created" ON feedback_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feedback_items fi 
      WHERE fi.id = feedback_attachments.feedback_id 
      AND fi.user_id = auth.uid()
    )
  );

-- Create the get_committed_profiles RPC function
CREATE OR REPLACE FUNCTION get_committed_profiles(p_need_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  gift_selections TEXT[],
  profile_photo TEXT,
  city TEXT,
  state TEXT,
  approval_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a leader in the organization that owns this need
  IF NOT EXISTS (
    SELECT 1 
    FROM needs n
    JOIN profiles p ON p.org_id = n.org_id
    WHERE n.id = p_need_id 
    AND p.id = auth.uid()
    AND p.is_leader = true
  ) THEN
    -- Not a leader, return empty result
    RETURN;
  END IF;

  -- Return committed user profiles for this need
  RETURN QUERY
  SELECT 
    pr.id,
    pr.full_name,
    pr.gift_selections,
    pr.profile_photo,
    pr.city,
    pr.state,
    pr.approval_status
  FROM commitments c
  JOIN profiles pr ON pr.id = c.user_id
  WHERE c.need_id = p_need_id
  AND c.status = 'confirmed';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_committed_profiles(UUID) TO authenticated;

-- Insert sample data (optional)
INSERT INTO orgs (id, name) VALUES 
  ('484467e2-970a-478a-a10d-564e7e666666', 'Sample Organization')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_leader ON profiles(is_leader);
CREATE INDEX IF NOT EXISTS idx_needs_org_id ON needs(org_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_commitments_need_id ON commitments(need_id);
CREATE INDEX IF NOT EXISTS idx_commitments_user_id ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
