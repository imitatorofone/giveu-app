# Profile Page - Fixed 400 Error

## Issue
The profile page was throwing a 400 error because the query was trying to select `avatar_url` column which doesn't exist in the database yet.

## Fix Applied
1. ✅ Removed `avatar_url` from the profile query SELECT statement
2. ✅ Set `avatar_url` to empty string when loading profile
3. ✅ Commented out database update in `handleAvatarUpload` function
4. ✅ Avatar upload still works for local state (uploads to storage)
5. ✅ Shows informative toast message about persistence

## To Enable Full Avatar Functionality

### Step 1: Add Database Column
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### Step 2: Update Profile Query
In `engage/app/profile/page.tsx` line 97, add `avatar_url` back:
```typescript
.select('id, full_name, email, city, phone, age, availability, gift_selections, is_leader, church_code, role, approval_status, notification_preferences, avatar_url')
```

### Step 3: Update Profile Loading
In `engage/app/profile/page.tsx` lines 157 and 161:
```typescript
avatar_url: profile.avatar_url || '',
// ...
setAvatarUrl(profile.avatar_url || '');
```

### Step 4: Uncomment Database Update
In `engage/app/profile/page.tsx` lines 257-262, uncomment:
```typescript
const { error: updateError } = await supabase
  .from('profiles')
  .update({ avatar_url: publicUrl })
  .eq('id', user.id);
if (updateError) throw updateError;
```

### Step 5: Update Toast Message
In `engage/app/profile/page.tsx` line 267:
```typescript
toast.success('Profile picture updated!');
```

## Current Behavior
- ✅ Profile page loads without errors
- ✅ Avatar upload works (uploads to storage)
- ✅ Avatar displays in current session
- ⚠️ Avatar doesn't persist after page refresh (until database column is added)

## Reference
- Migration file: `engage/supabase/migrations/add_avatar_url_and_storage.sql`
- Setup guide: `engage/docs/profile-picture-setup.md`
- Implementation summary: `engage/docs/profile-picture-implementation-summary.md`

