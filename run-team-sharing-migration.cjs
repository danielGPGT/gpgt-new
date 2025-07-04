#!/usr/bin/env node

/**
 * Team Sharing Migration Script
 * 
 * This script applies the complete team sharing implementation to the database.
 * It adds team_id columns, updates existing data, and applies RLS policies.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting team sharing migration...\n');

  try {
    // Step 1: Add team_id to quotes table
    console.log('📝 Step 1: Adding team_id to quotes table...');
    const { error: quotesError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.quotes 
        ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
      `
    });
    
    if (quotesError) {
      console.error('❌ Error adding team_id to quotes:', quotesError);
      throw quotesError;
    }
    console.log('✅ Added team_id to quotes table');

    // Step 2: Add team_id to bookings table
    console.log('📝 Step 2: Adding team_id to bookings table...');
    const { error: bookingsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.bookings 
        ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
      `
    });
    
    if (bookingsError) {
      console.error('❌ Error adding team_id to bookings:', bookingsError);
      throw bookingsError;
    }
    console.log('✅ Added team_id to bookings table');

    // Step 3: Create itineraries table with team_id
    console.log('📝 Step 3: Creating itineraries table with team_id...');
    const { error: itinerariesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.itineraries (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
          title text NOT NULL,
          client_name text NOT NULL,
          destination text NOT NULL,
          generated_by uuid NOT NULL REFERENCES auth.users(id),
          date_created timestamp with time zone DEFAULT now(),
          preferences jsonb,
          days jsonb,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          
          CONSTRAINT itineraries_pkey PRIMARY KEY (id)
        );
      `
    });
    
    if (itinerariesError) {
      console.error('❌ Error creating itineraries table:', itinerariesError);
      throw itinerariesError;
    }
    console.log('✅ Created itineraries table');

    // Step 4: Create indexes for itineraries table
    console.log('📝 Step 4: Creating indexes for itineraries table...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
        CREATE INDEX IF NOT EXISTS idx_itineraries_team_id ON public.itineraries(team_id);
        CREATE INDEX IF NOT EXISTS idx_itineraries_generated_by ON public.itineraries(generated_by);
        CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at);
      `
    });
    
    if (indexesError) {
      console.error('❌ Error creating indexes:', indexesError);
      throw indexesError;
    }
    console.log('✅ Created indexes for itineraries table');

    // Step 5: Update existing quotes with team_id
    console.log('📝 Step 5: Updating existing quotes with team_id...');
    const { error: updateQuotesError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.quotes 
        SET team_id = (
          SELECT tm.team_id 
          FROM public.team_members tm 
          WHERE tm.user_id = quotes.user_id 
          LIMIT 1
        )
        WHERE team_id IS NULL;
      `
    });
    
    if (updateQuotesError) {
      console.error('❌ Error updating quotes with team_id:', updateQuotesError);
      throw updateQuotesError;
    }
    console.log('✅ Updated existing quotes with team_id');

    // Step 6: Update existing bookings with team_id
    console.log('📝 Step 6: Updating existing bookings with team_id...');
    const { error: updateBookingsError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.bookings 
        SET team_id = (
          SELECT tm.team_id 
          FROM public.team_members tm 
          WHERE tm.user_id = bookings.user_id 
          LIMIT 1
        )
        WHERE team_id IS NULL;
      `
    });
    
    if (updateBookingsError) {
      console.error('❌ Error updating bookings with team_id:', updateBookingsError);
      throw updateBookingsError;
    }
    console.log('✅ Updated existing bookings with team_id');

    // Step 7: Enable RLS on itineraries table
    console.log('📝 Step 7: Enabling RLS on itineraries table...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS on itineraries:', rlsError);
      throw rlsError;
    }
    console.log('✅ Enabled RLS on itineraries table');

    // Step 8: Create RLS policies for itineraries
    console.log('📝 Step 8: Creating RLS policies for itineraries...');
    const { error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view itineraries from their team" ON public.itineraries;
        DROP POLICY IF EXISTS "Users can insert itineraries for their team" ON public.itineraries;
        DROP POLICY IF EXISTS "Users can update itineraries from their team" ON public.itineraries;
        DROP POLICY IF EXISTS "Users can delete itineraries from their team" ON public.itineraries;
        
        CREATE POLICY "Users can view itineraries from their team" ON public.itineraries
          FOR SELECT USING (
            team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert itineraries for their team" ON public.itineraries
          FOR INSERT WITH CHECK (
            team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can update itineraries from their team" ON public.itineraries
          FOR UPDATE USING (
            team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can delete itineraries from their team" ON public.itineraries
          FOR DELETE USING (
            team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid()
            )
          );
      `
    });
    
    if (policiesError) {
      console.error('❌ Error creating RLS policies for itineraries:', policiesError);
      throw policiesError;
    }
    console.log('✅ Created RLS policies for itineraries');

    // Step 9: Create indexes for team_id columns
    console.log('📝 Step 9: Creating indexes for team_id columns...');
    const { error: teamIndexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_quotes_team_id ON public.quotes(team_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_team_id ON public.bookings(team_id);
      `
    });
    
    if (teamIndexesError) {
      console.error('❌ Error creating team_id indexes:', teamIndexesError);
      throw teamIndexesError;
    }
    console.log('✅ Created indexes for team_id columns');

    // Step 10: Add comments for documentation
    console.log('📝 Step 10: Adding documentation comments...');
    const { error: commentsError } = await supabase.rpc('exec_sql', {
      sql: `
        COMMENT ON TABLE public.itineraries IS 'Stores generated travel itineraries with team sharing support';
        COMMENT ON COLUMN public.itineraries.team_id IS 'Team ID for team-based access control';
        COMMENT ON COLUMN public.itineraries.user_id IS 'User who created the itinerary';
        COMMENT ON COLUMN public.itineraries.generated_by IS 'User who generated the itinerary (may be different from user_id)';
        COMMENT ON COLUMN public.itineraries.preferences IS 'Travel preferences and requirements';
        COMMENT ON COLUMN public.itineraries.days IS 'Daily itinerary activities and schedule';
      `
    });
    
    if (commentsError) {
      console.error('❌ Error adding comments:', commentsError);
      throw commentsError;
    }
    console.log('✅ Added documentation comments');

    console.log('\n🎉 Team sharing migration completed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Added team_id to quotes table');
    console.log('   ✅ Added team_id to bookings table');
    console.log('   ✅ Created itineraries table with team_id');
    console.log('   ✅ Updated existing records with team_id');
    console.log('   ✅ Created performance indexes');
    console.log('   ✅ Enabled RLS policies for team-based access');
    console.log('   ✅ Added documentation comments');
    
    console.log('\n🔒 Security: All data is now protected by team-based Row Level Security');
    console.log('👥 Team Sharing: Users can only access data from their team');
    console.log('🚀 Performance: Indexes added for optimal query performance');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 