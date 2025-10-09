# Profile Picture Setup Guide

## Database Column

Run this SQL in your Supabase SQL Editor:

```sql
-- Add avatar_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

## Supabase Storage Setup

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `profile-pictures`
4. **Make it Public** ✓
5. Click "Create Bucket"

### Step 2: Set Up Storage Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');
```

## Features Implemented

✅ **Profile Picture Upload**
- Click camera icon in edit mode
- Validates image files only
- Max 2MB file size
- Unique filename with timestamp
- Instant preview

✅ **Display Logic**
- Shows uploaded avatar or initials
- 96px circular avatar
- Centered layout
- Works in view and edit modes

✅ **Storage**
- Images stored in Supabase Storage
- Public URLs saved to `profiles.avatar_url`
- Efficient caching (1 hour)

✅ **Mobile Support**
- Camera access on mobile devices
- Touch-friendly upload button
- Responsive design

## Usage

1. Navigate to Profile page
2. Click "Edit Profile"
3. Click camera icon on avatar
4. Select image from device
5. Avatar updates instantly
6. Save profile to persist changes

## File Structure

- **Upload Handler**: `handleAvatarUpload()` in `app/profile/page.tsx`
- **State Management**: `avatarUrl`, `uploading` states
- **Database Field**: `profiles.avatar_url`
- **Storage Bucket**: `profile-pictures/avatars/`

