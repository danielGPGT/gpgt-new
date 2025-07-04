const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://uesuuvzjirdudiwtalwv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('Testing database schema...\n');

  try {
    // Test 1: Check if teams table exists and has correct structure
    console.log('1. Testing teams table...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
    
    if (teamsError) {
      console.error('Teams table error:', teamsError);
    } else {
      console.log('Teams table accessible, sample data:', teams);
    }

    // Test 2: Check if team_members table exists and has correct structure
    console.log('\n2. Testing team_members table...');
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('*')
      .limit(1);
    
    if (teamMembersError) {
      console.error('Team members table error:', teamMembersError);
    } else {
      console.log('Team members table accessible, sample data:', teamMembers);
    }

    // Test 3: Check if team_invitations table exists and has correct structure
    console.log('\n3. Testing team_invitations table...');
    const { data: teamInvitations, error: teamInvitationsError } = await supabase
      .from('team_invitations')
      .select('*')
      .limit(1);
    
    if (teamInvitationsError) {
      console.error('Team invitations table error:', teamInvitationsError);
    } else {
      console.log('Team invitations table accessible, sample data:', teamInvitations);
    }

    // Test 4: Check specific query that's failing
    console.log('\n4. Testing the specific failing query...');
    const { data: specificQuery, error: specificError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', '0cef0867-1b40-4de1-9936-16b867a753d7')
      .eq('email', 'danieljamesglancy@gmail.com');
    
    if (specificError) {
      console.error('Specific query error:', specificError);
    } else {
      console.log('Specific query successful:', specificQuery);
    }

    // Test 5: Check RLS status
    console.log('\n5. Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status');
    
    if (rlsError) {
      console.log('RLS status check failed (this is normal):', rlsError.message);
    } else {
      console.log('RLS status:', rlsStatus);
    }

  } catch (error) {
    console.error('General error:', error);
  }
}

// Run the test
testDatabaseSchema(); 