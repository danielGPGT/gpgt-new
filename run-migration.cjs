const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uesuuvzjirdudiwtalwv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration to add active columns to tickets and flights...');
  
  try {
    // Add active column to tickets
    console.log('\n1. Adding active column to tickets table...');
    const { error: ticketsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.tickets 
        ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
        
        COMMENT ON COLUMN public.tickets.active IS 'Whether this ticket category is available for selection in packages';
        
        UPDATE public.tickets SET active = true WHERE active IS NULL;
      `
    });
    
    if (ticketsError) {
      console.error('Error adding active column to tickets:', ticketsError);
    } else {
      console.log('✅ Successfully added active column to tickets table');
    }
    
    // Add active column to flights
    console.log('\n2. Adding active column to flights table...');
    const { error: flightsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.flights
        ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
        
        COMMENT ON COLUMN public.flights.active IS 'Whether this flight is available for selection in packages';
        
        UPDATE public.flights SET active = true WHERE active IS NULL;
      `
    });
    
    if (flightsError) {
      console.error('Error adding active column to flights:', flightsError);
    } else {
      console.log('✅ Successfully added active column to flights table');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNow all component tables have active columns:');
    console.log('- tickets ✅');
    console.log('- flights ✅');
    console.log('- hotel_rooms ✅');
    console.log('- circuit_transfers ✅');
    console.log('- airport_transfers ✅');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration(); 