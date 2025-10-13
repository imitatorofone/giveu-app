-- Create the get_committed_profiles RPC function
-- This function allows leaders to see committed users for needs in their organization

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
SECURITY DEFINER -- Run with elevated permissions to bypass RLS
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_committed_profiles(UUID) TO authenticated;
