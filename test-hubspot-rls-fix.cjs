const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHubSpotRLSFix() {
  console.log('🔍 Testing HubSpot RLS fix...\n');

  try {
    // Test 1: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User authentication error:', userError.message);
      return;
    }
    console.log('✅ User authenticated:', user.email);

    // Test 2: Get user's team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('team_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (teamError) {
      console.error('❌ Team member lookup error:', teamError.message);
      return;
    }
    console.log('✅ Team member found:', { teamId: teamMember.team_id, status: teamMember.status });

    // Test 3: Test hubspot_sync_logs access
    console.log('\n📊 Testing hubspot_sync_logs access...');
    const { data: syncLogs, error: syncError } = await supabase
      .from('hubspot_sync_logs')
      .select('*')
      .eq('team_id', teamMember.team_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (syncError) {
      console.error('❌ HubSpot sync logs error:', syncError.message);
      console.error('   Code:', syncError.code);
      console.error('   Details:', syncError.details);
      console.error('   Hint:', syncError.hint);
    } else {
      console.log('✅ HubSpot sync logs accessible!');
      console.log(`   Found ${syncLogs.length} sync logs`);
      if (syncLogs.length > 0) {
        console.log('   Latest sync log:', {
          id: syncLogs[0].id,
          sync_type: syncLogs[0].sync_type,
          status: syncLogs[0].status,
          created_at: syncLogs[0].created_at
        });
      }
    }

    // Test 4: Test hubspot_connections access
    console.log('\n🔗 Testing hubspot_connections access...');
    const { data: connections, error: connError } = await supabase
      .from('hubspot_connections')
      .select('*')
      .eq('team_id', teamMember.team_id);

    if (connError) {
      console.error('❌ HubSpot connections error:', connError.message);
    } else {
      console.log('✅ HubSpot connections accessible!');
      console.log(`   Found ${connections.length} connections`);
    }

    // Test 5: Test hubspot_sync_settings access
    console.log('\n⚙️ Testing hubspot_sync_settings access...');
    const { data: settings, error: settingsError } = await supabase
      .from('hubspot_sync_settings')
      .select('*')
      .eq('team_id', teamMember.team_id);

    if (settingsError) {
      console.error('❌ HubSpot sync settings error:', settingsError.message);
    } else {
      console.log('✅ HubSpot sync settings accessible!');
      console.log(`   Found ${settings.length} settings`);
    }

    // Test 6: Test inserting a sync log (if we have write access)
    console.log('\n✍️ Testing sync log creation...');
    const testSyncLog = {
      team_id: teamMember.team_id,
      sync_type: 'test',
      status: 'success',
      details: { message: 'Test sync log from RLS fix verification' },
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0
    };

    const { data: newLog, error: insertError } = await supabase
      .from('hubspot_sync_logs')
      .insert(testSyncLog)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Sync log creation error:', insertError.message);
    } else {
      console.log('✅ Sync log creation successful!');
      console.log('   Created log ID:', newLog.id);
      
      // Clean up test log
      await supabase
        .from('hubspot_sync_logs')
        .delete()
        .eq('id', newLog.id);
      console.log('   Test log cleaned up');
    }

    console.log('\n🎉 HubSpot RLS fix verification complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testHubSpotRLSFix(); 