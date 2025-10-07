-- Fix existing phone numbers to E.164 format
-- Run this in your Supabase SQL editor after implementing the phone formatter

-- Update phone numbers to E.164 format
-- This handles various formats and converts them to +1XXXXXXXXXX
UPDATE profiles
SET phone = '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL 
  AND phone != ''
  AND NOT phone LIKE '+%'
  AND length(regexp_replace(phone, '[^0-9]', '', 'g')) = 10;

-- For 11-digit numbers that start with 1, just add the +
UPDATE profiles
SET phone = '+' || regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL 
  AND phone != ''
  AND NOT phone LIKE '+%'
  AND length(regexp_replace(phone, '[^0-9]', '', 'g')) = 11
  AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE '1%';

-- Clear invalid phone numbers (less than 10 digits or more than 11)
UPDATE profiles
SET phone = NULL
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    length(regexp_replace(phone, '[^0-9]', '', 'g')) < 10 
    OR length(regexp_replace(phone, '[^0-9]', '', 'g')) > 11
  );

-- Verify the results
SELECT 
  id,
  full_name,
  phone,
  length(regexp_replace(phone, '[^0-9]', '', 'g')) as digit_count
FROM profiles 
WHERE phone IS NOT NULL
ORDER BY phone;
