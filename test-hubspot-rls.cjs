const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHubSpotRLS() {
  try {
    console.log('🔍 Testing HubSpot RLS policies...\n');

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log('✅ User authenticated:', user.id);

    // 2. Check if user exists in public.users
    const { data: publicUser, error: publicUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('📋 Public user record:', publicUser ? '✅ Found' : '❌ Not found');
    if (publicUserError) console.log('   Error:', publicUserError.message);

    // 3. Check team membership
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('👥 Team memberships:', teamMembers?.length || 0);
    if (teamMembers && teamMembers.length > 0) {
      teamMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. Team: ${member.team_id}, Role: ${member.role}, Status: ${member.status}`);
      });
    }
    if (teamError) console.log('   Error:', teamError.message);

    // 4. Check if user owns any teams
    const { data: ownedTeams, error: ownedError } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id);
    
    console.log('🏢 Owned teams:', ownedTeams?.length || 0);
    if (ownedTeams && ownedTeams.length > 0) {
      ownedTeams.forEach((team, index) => {
        console.log(`   ${index + 1}. Team: ${team.id}, Name: ${team.name}`);
      });
    }
    if (ownedError) console.log('   Error:', ownedError.message);

    // 5. Get the team ID we should use for HubSpot
    let teamId = null;
    if (teamMembers && teamMembers.length > 0) {
      const activeMember = teamMembers.find(m => m.status === 'active');
      if (activeMember) {
        teamId = activeMember.team_id;
        console.log('🎯 Using team from membership:', teamId);
      }
    } else if (ownedTeams && ownedTeams.length > 0) {
      teamId = ownedTeams[0].id;
      console.log('🎯 Using owned team:', teamId);
    }

    if (!teamId) {
      console.log('❌ No team found for user');
      return;
    }

    // 6. Test HubSpot table access
    console.log('\n🔐 Testing HubSpot table access...');
    
    // Test hubspot_connections
    const { data: connections, error: connectionsError } = await supabase
      .from('hubspot_connections')
      .select('*')
      .eq('team_id', teamId);
    
    console.log('🔗 HubSpot connections:', connections?.length || 0);
    if (connectionsError) {
      console.log('   ❌ Error:', connectionsError.message);
      console.log('   Code:', connectionsError.code);
    }

    // Test hubspot_sync_settings
    const { data: syncSettings, error: syncSettingsError } = await supabase
      .from('hubspot_sync_settings')
      .select('*')
      .eq('team_id', teamId);
    
    console.log('⚙️ HubSpot sync settings:', syncSettings?.length || 0);
    if (syncSettingsError) {
      console.log('   ❌ Error:', syncSettingsError.message);
      console.log('   Code:', syncSettingsError.code);
    }

    // Test hubspot_sync_logs
    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('hubspot_sync_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('📊 HubSpot sync logs:', syncLogs?.length || 0);
    if (syncLogsError) {
      console.log('   ❌ Error:', syncLogsError.message);
      console.log('   Code:', syncLogsError.code);
    }

    // 7. Check RLS policies
    console.log('\n🔍 Checking RLS policies...');
    
    // Check if user is team owner
    const { data: teamOwner, error: ownerError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();
    
    const isOwner = teamOwner?.owner_id === user.id;
    console.log('👑 Is team owner:', isOwner);

    // Check if user is team admin
    const isAdmin = teamMembers?.some(m => 
      m.team_id === teamId && 
      m.status === 'active' && 
      ['owner', 'admin'].includes(m.role)
    );
    console.log('🛡️ Is team admin:', isAdmin);

    // Check if user is active team member
    const isActiveMember = teamMembers?.some(m => 
      m.team_id === teamId && 
      m.status === 'active'
    );
    console.log('✅ Is active team member:', isActiveMember);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHubSpotRLS(); 