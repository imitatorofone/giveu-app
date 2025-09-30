-- Create opportunity_responses table
-- Run this in your Supabase SQL editor

-- Drop the table if it exists (for clean setup)
DROP TABLE IF EXISTS opportunity_responses CASCADE;

-- Create the table
CREATE TABLE opportunity_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response_type TEXT DEFAULT 'volunteer',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leader_notified BOOLEAN DEFAULT FALSE,
  leader_approved_at TIMESTAMP WITH TIME ZONE,
  leader_approved_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(need_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_opportunity_responses_need_id ON opportunity_responses(need_id);
CREATE INDEX idx_opportunity_responses_user_id ON opportunity_responses(user_id);
CREATE INDEX idx_opportunity_responses_status ON opportunity_responses(status);
CREATE INDEX idx_opportunity_responses_created_at ON opportunity_responses(created_at);

-- Enable RLS
ALTER TABLE opportunity_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own responses
CREATE POLICY "Users can insert their own responses" ON opportunity_responses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own responses
CREATE POLICY "Users can view their own responses" ON opportunity_responses
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own responses (for cancellation)
CREATE POLICY "Users can update their own responses" ON opportunity_responses
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Leaders can view all responses (simplified for MVP)
CREATE POLICY "Leaders can view all responses" ON opportunity_responses
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles leader
    WHERE leader.id = auth.uid()
      AND leader.role IN ('leader', 'admin')
  )
);

-- Leaders can update all responses (simplified for MVP)
CREATE POLICY "Leaders can update all responses" ON opportunity_responses
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles leader
    WHERE leader.id = auth.uid()
      AND leader.role IN ('leader', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles leader
    WHERE leader.id = auth.uid()
      AND leader.role IN ('leader', 'admin')
  )
);

-- Test the table
SELECT 'Table created successfully' as status;
