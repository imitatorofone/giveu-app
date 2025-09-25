-- Minimal table creation script
-- Run this if tables don't exist at all

-- Create orgs table
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- Insert sample org if it doesn't exist
INSERT INTO orgs (id, name) VALUES 
  ('484467e2-970a-478a-a10d-564e7e666666', 'Sample Organization')
ON CONFLICT (id) DO NOTHING;
