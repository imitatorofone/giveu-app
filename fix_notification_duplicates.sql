-- Fix notification duplicates by adding unique constraint
-- This prevents duplicate notifications at the database level

-- First, clean up any existing duplicates
-- Delete duplicate notifications, keeping only the most recent one
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, event_type, 
      (event_data->>'need_id'), 
      (event_data->>'volunteer_id')
      ORDER BY created_at DESC
    ) as rn
  FROM notifications 
  WHERE event_type = 'volunteer.signed_up'
    AND event_data->>'need_id' IS NOT NULL
    AND event_data->>'volunteer_id' IS NOT NULL
    AND read_at IS NULL
)
DELETE FROM notifications 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
-- Only applies to unread volunteer signup notifications
CREATE UNIQUE INDEX IF NOT EXISTS unique_unread_volunteer_notifications
ON notifications (user_id, event_type, (event_data->>'need_id'), (event_data->>'volunteer_id'))
WHERE event_type = 'volunteer.signed_up' 
  AND event_data->>'need_id' IS NOT NULL
  AND event_data->>'volunteer_id' IS NOT NULL
  AND read_at IS NULL;

-- Also add a more general constraint for any unread notifications with the same key data
CREATE UNIQUE INDEX IF NOT EXISTS unique_unread_notifications
ON notifications (user_id, event_type, (event_data->>'need_id'))
WHERE event_type IN ('volunteer.signed_up', 'need.fulfilled', 'need.approved')
  AND event_data->>'need_id' IS NOT NULL
  AND read_at IS NULL;
