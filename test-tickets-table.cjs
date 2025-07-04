const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://uesuuvzjirdudiwtalwv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTicketsTable() {
  console.log('Testing tickets table structure...');
  
  try {
    // First, let's try to get all tickets without any filters
    console.log('\n1. Testing basic select without filters:');
    const { data: allTickets, error: error1 } = await supabase
      .from('tickets')
      .select('*')
      .limit(1);
    
    if (error1) {
      console.error('Error fetching all tickets:', error1);
    } else {
      console.log('Success! Found tickets:', allTickets?.length || 0);
      if (allTickets && allTickets.length > 0) {
        console.log('Sample ticket columns:', Object.keys(allTickets[0]));
      }
    }
    
    // Test if event_id column exists
    console.log('\n2. Testing event_id column:');
    const { data: ticketsByEvent, error: error2 } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', '5f9f064a-db2c-492f-9baa-a2bf75ce5211')
      .limit(1);
    
    if (error2) {
      console.error('Error with event_id filter:', error2);
    } else {
      console.log('Success with event_id filter! Found:', ticketsByEvent?.length || 0);
    }
    
    // Test if active column exists
    console.log('\n3. Testing active column:');
    const { data: activeTickets, error: error3 } = await supabase
      .from('tickets')
      .select('*')
      .eq('active', true)
      .limit(1);
    
    if (error3) {
      console.error('Error with active filter:', error3);
    } else {
      console.log('Success with active filter! Found:', activeTickets?.length || 0);
    }
    
    // Test both filters together
    console.log('\n4. Testing both filters together:');
    const { data: filteredTickets, error: error4 } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', '5f9f064a-db2c-492f-9baa-a2bf75ce5211')
      .eq('active', true)
      .limit(1);
    
    if (error4) {
      console.error('Error with both filters:', error4);
    } else {
      console.log('Success with both filters! Found:', filteredTickets?.length || 0);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testTicketsTable(); 