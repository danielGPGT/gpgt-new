const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBookingDeletionRLS() {
  try {
    console.log('🔧 Fixing Booking Deletion RLS Policies...');
    
    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix_booking_deletion_rls.sql'), 'utf8');
    
    console.log('📝 Executing SQL script...');
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', {
      sql: sqlScript
    });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error);
      throw error;
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