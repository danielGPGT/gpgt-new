const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicAccess() {
  try {
    console.log('🔍 Testing basic database access...\n');

    // Test 1: Check if we can access teams table
    console.log('1. Testing teams table access...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .limit(5);
    
    if (teamsError) {
      console.log('   ❌ Teams access failed:', teamsError.message);
    } else {
      console.log('   ✅ Teams access successful:', teams?.length || 0, 'teams found');
    }

    // Test 2: Check if we can access team_members table
    console.log('\n2. Testing team_members table access...');
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('team_id, user_id, role')
      .limit(5);
    
    if (membersError) {
      console.log('   ❌ Team members access failed:', membersError.message);
    } else {
      console.log('   ✅ Team members access successful:', members?.length || 0, 'members found');
    }

    // Test 3: Check if we can access the specific team
    console.log('\n3. Testing specific team access...');
    const teamId = '0cef0867-1b40-4de1-9936-16b867a753d7';
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError) {
      console.log('   ❌ Specific team access failed:', teamError.message);
    } else {
      console.log('   ✅ Specific team found:', team.name);
    }

    // Test 4: Check HubSpot tables with RLS disabled
    console.log('\n4. Testing HubSpot tables (RLS should be disabled)...');
    
    const { data: connections, error: connectionsError } = await supabase
      .from('hubspot_connections')
      .select('*')
      .eq('team_id', teamId);
    
    if (connectionsError) {
      console.log('   ❌ HubSpot connections failed:', connectionsError.message);
      console.log('   Code:', connectionsError.code);
    } else {
      console.log('   ✅ HubSpot connections successful:', connections?.length || 0, 'connections');
    }

    const { data: syncSettings, error: syncSettingsError } = await supabase
      .from('hubspot_sync_settings')
      .select('*')
      .eq('team_id', teamId);
    
    if (syncSettingsError) {
      console.log('   ❌ HubSpot sync settings failed:', syncSettingsError.message);
      console.log('   Code:', syncSettingsError.code);
    } else {
      console.log('   ✅ HubSpot sync settings successful:', syncSettings?.length || 0, 'settings');
    }

    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('hubspot_sync_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (syncLogsError) {
      console.log('   ❌ HubSpot sync logs failed:', syncLogsError.message);
      console.log('   Code:', syncLogsError.code);
    } else {
      console.log('   ✅ HubSpot sync logs successful:', syncLogs?.length || 0, 'logs');
    }

    // Test 5: Check if we can create a test record
    console.log('\n5. Testing record creation...');
    const { data: testRecord, error: createError } = await supabase
      .from('hubspot_sync_logs')
      .insert({
        team_id: teamId,
        sync_type: 'test',
        status: 'completed',
        records_processed: 0,
        records_synced: 0,
        records_failed: 0
      })
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ Record creation failed:', createError.message);
    } else {
      console.log('   ✅ Record creation successful, ID:', testRecord.id);
      
      // Clean up test record
      await supabase
        .from('hubspot_sync_logs')
        .delete()
        .eq('id', testRecord.id);
      console.log('   🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBasicAccess(); 