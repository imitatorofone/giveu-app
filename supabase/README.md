# Supabase Database Setup

## Required SQL Scripts

Run these SQL scripts in your Supabase SQL Editor in the following order:

### 1. Create opportunity_responses table
```sql
-- Run: supabase/policies/opportunity_responses_table.sql
```

This script creates:
- `opportunity_responses` table with proper schema
- Indexes for performance
- Row Level Security (RLS) policies for data access control

### 2. Update existing RLS policies (if needed)
```sql
-- Run: supabase/policies/needs_leader_policies.sql
```

This script ensures leaders can read and update needs in their organization.

## Database Schema Overview

### opportunity_responses table
- `id`: Primary key (UUID)
- `need_id`: References needs table
- `user_id`: References auth.users table
- `response_type`: Type of response (default: 'volunteer')
- `status`: 'pending', 'accepted', or 'declined'
- `created_at`: When the response was submitted
- `leader_notified`: Whether leader has been notified
- `leader_approved_at`: When leader approved/declined
- `leader_approved_by`: Which leader made the decision

### RLS Policies
- Users can insert and view their own responses
- Leaders can view and update all responses for needs in their organization
- Proper church_code-based organization isolation

## Testing the Setup

1. Create a need as a leader
2. Have a member click "I Can Help" on the dashboard
3. Check the leader tools page for the pending response
4. Accept or decline the response
5. Verify the status updates correctly

## Troubleshooting

If you encounter 500 errors:
1. Check that the `opportunity_responses` table exists
2. Verify RLS policies are properly applied
3. Ensure the `church_code` field is populated in profiles
4. Check that leaders have the correct `role` value ('leader' or 'admin')