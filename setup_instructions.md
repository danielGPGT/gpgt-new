# Database Setup Instructions

## Current Issues
You're experiencing multiple database errors:
1. **406 errors** on `usage_tracking` table - Table doesn't exist
2. **403/42501 errors** on `itineraries` table - RLS policy violations
3. **Missing tables** - The tier system tables haven't been created yet

## Solution Steps

### Step 1: Check Current Database State
First, run the `check_and_reset.sql` script in your Supabase SQL Editor to see what tables exist:

```sql
-- Run this in Supabase SQL Editor
-- File: check_and_reset.sql
```

This will tell you which tables are missing.

### Step 2: Reset Database (Recommended)
If tables are missing or you want a clean slate, run the `reset_database.sql` script:

```sql
-- Run this in Supabase SQL Editor
-- File: reset_database.sql
```

This script will:
- Drop all existing tables, policies, triggers, and functions
- Recreate everything from scratch with proper RLS policies
- Set up the tier system tables (`subscriptions`, `usage_tracking`)
- Create proper triggers for user profile and subscription creation
- Grant correct permissions

### Step 3: Verify Setup
After running the reset script, you should see:
- All 4 tables created: `users`, `subscriptions`, `usage_tracking`, `itineraries`
- RLS policies enabled and working
- Triggers created for automatic profile/subscription creation

### Step 4: Test the App
Once the database is set up:
1. Try logging in again
2. Create a new itinerary
3. Check that the tier system works (Usage & Plans tab)

## What the Reset Script Does

The `reset_database.sql` script:

1. **Cleans up** - Drops all existing objects with CASCADE to handle dependencies
2. **Creates tables** - All 4 tables with proper structure and relationships
3. **Enables RLS** - Row Level Security on all tables
4. **Creates policies** - Proper access control for authenticated users
5. **Sets up triggers** - Automatic user profile and subscription creation
6. **Grants permissions** - Correct access for authenticated users
7. **Creates starter subscriptions** - For existing users

## Fallback: Manual Table Creation
If the reset script fails, you can manually create just the missing tables:

```sql
-- Create usage_tracking table
CREATE TABLE public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    itineraries_created INTEGER DEFAULT 0,
    pdf_downloads INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.usage_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.usage_tracking TO authenticated;
```

## Troubleshooting

### If you still get RLS errors:
1. Make sure you're logged in
2. Check that the user has a profile in the `users` table
3. Verify RLS policies are created correctly

### If tables still don't exist:
1. Check your Supabase project settings
2. Make sure you're running scripts in the correct project
3. Try running the reset script again

### If you get permission errors:
1. Make sure you're using the correct Supabase credentials
2. Check that the service role has proper permissions
3. Verify the RLS policies are set up correctly

## Next Steps
After fixing the database:
1. Test itinerary creation
2. Check the Usage & Plans dashboard
3. Test PDF export functionality
4. Verify tier restrictions work properly 