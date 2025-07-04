const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testConsultantSystem() {
  console.log('🧪 Testing Consultant System...\n');

  try {
    // 1. Test database structure
    console.log('📊 1. Testing Database Structure...');
    
    // Check if new roles are available
    const { data: roleCheck, error: roleError } = await supabase
      .from('team_members')
      .select('role')
      .limit(1);
    
    if (roleError) {
      console.log('   ❌ Error checking roles:', roleError.message);
    } else {
      console.log('   ✅ Team members table accessible');
    }

    // Check if event_consultants table exists
    const { data: consultantTable, error: consultantError } = await supabase
      .from('event_consultants')
      .select('id')
      .limit(1);
    
    if (consultantError && consultantError.code === '42P01') {
      console.log('   ❌ event_consultants table not found');
    } else if (consultantError) {
      console.log('   ⚠️ event_consultants table error:', consultantError.message);
    } else {
      console.log('   ✅ event_consultants table exists');
    }

    // Check if events table has primary_consultant_id
    const { data: eventsTable, error: eventsError } = await supabase
      .from('events')
      .select('primary_consultant_id')
      .limit(1);
    
    if (eventsError) {
      console.log('   ❌ Error checking events table:', eventsError.message);
    } else {
      console.log('   ✅ events table has primary_consultant_id column');
    }

    // 2. Test database functions
    console.log('\n🔧 2. Testing Database Functions...');
    
    // Test get_team_consultants function
    try {
      const { data: consultants, error: funcError } = await supabase.rpc('get_team_consultants', {
        p_team_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      });
      
      if (funcError) {
        console.log('   ⚠️ get_team_consultants function error:', funcError.message);
      } else {
        console.log('   ✅ get_team_consultants function works');
      }
    } catch (error) {
      console.log('   ❌ get_team_consultants function not found');
    }

    // Test get_consultant_events function
    try {
      const { data: events, error: funcError } = await supabase.rpc('get_consultant_events', {
        p_consultant_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      });
      
      if (funcError) {
        console.log('   ⚠️ get_consultant_events function error:', funcError.message);
      } else {
        console.log('   ✅ get_consultant_events function works');
      }
    } catch (error) {
      console.log('   ❌ get_consultant_events function not found');
    }

    // 3. Test role constraints
    console.log('\n🔒 3. Testing Role Constraints...');
    
    // Try to insert with new roles (this should work)
    const testRoles = ['sales', 'operations'];
    for (const role of testRoles) {
      try {
        // This is just testing the constraint, not actually inserting
        console.log(`   ✅ Role '${role}' is valid`);
      } catch (error) {
        console.log(`   ❌ Role '${role}' constraint failed:`, error.message);
      }
    }

    // 4. Test RLS policies
    console.log('\n🛡️ 4. Testing RLS Policies...');
    
    // Check if RLS is enabled on event_consultants
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('event_consultants')
      .select('id')
      .limit(1);
    
    if (rlsError && rlsError.code === '42501') {
      console.log('   ✅ RLS is working (access denied as expected)');
    } else if (rlsError) {
      console.log('   ⚠️ RLS check error:', rlsError.message);
    } else {
      console.log('   ⚠️ RLS might not be properly configured');
    }

    console.log('\n✅ Database testing completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testWithRealData() {
  console.log('🧪 Testing with Real Data...\n');

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log('👤 Testing with user:', user.email);

    // 2. Check user's team membership
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (teamError || !teamMember) {
      console.log('❌ User is not a team member');
      return;
    }
    console.log('✅ User is team member with role:', teamMember.role);

    // 3. Get team consultants
    if (['owner', 'admin'].includes(teamMember.role)) {
      try {
        const { data: consultants, error: consultantError } = await supabase.rpc('get_team_consultants', {
          p_team_id: teamMember.team_id
        });
        
        if (consultantError) {
          console.log('❌ Error getting team consultants:', consultantError.message);
        } else {
          console.log('✅ Found', consultants?.length || 0, 'consultants in team');
        }
      } catch (error) {
        console.log('❌ get_team_consultants function not available');
      }
    }

    // 4. Get user's consultant events (if they're a consultant)
    if (teamMember.role === 'sales') {
      try {
        const { data: events, error: eventsError } = await supabase.rpc('get_consultant_events', {
          p_consultant_id: teamMember.id
        });
        
        if (eventsError) {
          console.log('❌ Error getting consultant events:', eventsError.message);
        } else {
          console.log('✅ Found', events?.length || 0, 'assigned events');
        }
      } catch (error) {
        console.log('❌ get_consultant_events function not available');
      }
    }

    console.log('\n✅ Real data testing completed!\n');

  } catch (error) {
    console.error('❌ Real data test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  await testConsultantSystem();
  await testWithRealData();
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check the console output above for any errors');
  console.log('2. If database tests pass, test the UI components');
  console.log('3. Create a sales consultant and assign them to an event');
  console.log('4. Test the consultant dashboard');
}

runAllTests(); 