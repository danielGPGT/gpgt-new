const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixBookingDeletionRLS() {
  try {
    console.log('🔧 Fixing Booking Deletion RLS Policies...');
    
    // SQL commands to fix the RLS policies
    const sqlCommands = [
      // Drop existing policies if they exist
      `DROP POLICY IF EXISTS "Users can update their team's bookings" ON public.bookings;`,
      `DROP POLICY IF EXISTS "Users can delete their team's bookings" ON public.bookings;`,
      
      // Recreate UPDATE policy
      `CREATE POLICY "Users can update their team's bookings" ON public.bookings
        FOR UPDATE USING (
          team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );`,
      
      // Add DELETE policy for bookings
      `CREATE POLICY "Users can delete their team's bookings" ON public.bookings
        FOR DELETE USING (
          team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );`,
      
      // Add DELETE policies for related tables
      `DROP POLICY IF EXISTS "Users can delete their team's booking components" ON public.booking_components;`,
      `CREATE POLICY "Users can delete their team's booking components" ON public.booking_components
        FOR DELETE USING (
          booking_id IN (
            SELECT id FROM public.bookings 
            WHERE team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );`,
      
      `DROP POLICY IF EXISTS "Users can delete their team's booking payments" ON public.booking_payments;`,
      `CREATE POLICY "Users can delete their team's booking payments" ON public.booking_payments
        FOR DELETE USING (
          booking_id IN (
            SELECT id FROM public.bookings 
            WHERE team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );`,
      
      `DROP POLICY IF EXISTS "Users can delete their team's booking travelers" ON public.booking_travelers;`,
      `CREATE POLICY "Users can delete their team's booking travelers" ON public.booking_travelers
        FOR DELETE USING (
          booking_id IN (
            SELECT id FROM public.bookings 
            WHERE team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );`,
      
      `DROP POLICY IF EXISTS "Users can delete their team's booking flights" ON public.bookings_flights;`,
      `CREATE POLICY "Users can delete their team's booking flights" ON public.bookings_flights
        FOR DELETE USING (
          booking_id IN (
            SELECT id FROM public.bookings 
            WHERE team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );`,
      
      `DROP POLICY IF EXISTS "Users can delete their team's booking lounge passes" ON public.bookings_lounge_passes;`,
      `CREATE POLICY "Users can delete their team's booking lounge passes" ON public.bookings_lounge_passes
        FOR DELETE USING (
          booking_id IN (
            SELECT id FROM public.bookings 
            WHERE team_id IN (
              SELECT team_id FROM public.team_members 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );`
    ];
    
    console.log('📝 Executing SQL commands...');
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`   Executing command ${i + 1}/${sqlCommands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Error executing command ${i + 1}:`, error);
        console.error('SQL:', sql);
        throw error;
      }
    }
    
    console.log('✅ Booking deletion RLS policies fixed successfully!');
    console.log('');
    console.log('🔍 The following policies have been added/updated:');
    console.log('   - Users can update their team\'s bookings');
    console.log('   - Users can delete their team\'s bookings');
    console.log('   - Users can delete their team\'s booking components');
    console.log('   - Users can delete their team\'s booking payments');
    console.log('   - Users can delete their team\'s booking travelers');
    console.log('   - Users can delete their team\'s booking flights');
    console.log('   - Users can delete their team\'s booking lounge passes');
    console.log('');
    console.log('🎯 Booking deletion should now work correctly!');
    
  } catch (error) {
    console.error('❌ Failed to fix booking deletion RLS policies:', error);
    process.exit(1);
  }
}

// Run the fix
fixBookingDeletionRLS(); 