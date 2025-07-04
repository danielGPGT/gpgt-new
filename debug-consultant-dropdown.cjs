const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugConsultantDropdown() {
  console.log('🔍 Debugging Consultant Dropdown Issue...\n');

  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log('👤 Current user:', user.email);

    // 2. Check user's team membership
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('*, teams(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (teamError || !teamMember) {
      console.log('❌ User is not a team member');
      return;
    }

    console.log('✅ User team:', teamMember.teams.name);
    console.log('👑 User role:', teamMember.role);
    console.log('🔐 Can manage consultants:', ['owner', 'admin'].includes(teamMember.role));

    // 3. Check if user can manage consultants
    if (!['owner', 'admin'].includes(teamMember.role)) {
      console.log('❌ User cannot manage consultants (requires owner/admin role)');
      return;
    }

    // 4. Check all team members
    console.log('\n📋 All Team Members:');
    const { data: allMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamMember.team_id)
      .eq('status', 'active');

    if (membersError) {
      console.log('❌ Error getting team members:', membersError.message);
      return;
    }

    if (!allMembers || allMembers.length === 0) {
      console.log('❌ No team members found');
      return;
    }

    allMembers.forEach(member => {
      console.log(`   - ${member.name || member.email} (${member.role}) - ${member.status}`);
    });

    // 5. Check specifically for sales consultants
    console.log('\n🎯 Sales Consultants:');
    const salesConsultants = allMembers.filter(member => member.role === 'sales');
    
    if (salesConsultants.length === 0) {
      console.log('❌ No sales consultants found in team');
      console.log('💡 You need to create team members with role = "sales"');
      return;
    }

    salesConsultants.forEach(consultant => {
      console.log(`   ✅ ${consultant.name || consultant.email} (${consultant.role})`);
    });

    // 6. Test the get_team_consultants function
    console.log('\n🔧 Testing get_team_consultants function:');
    const { data: functionConsultants, error: funcError } = await supabase.rpc('get_team_consultants', {
      p_team_id: teamMember.team_id
    });

    if (funcError) {
      console.log('❌ Function error:', funcError.message);
      console.log('💡 The database function might not exist');
    } else {
      console.log('✅ Function returned:', functionConsultants?.length || 0, 'consultants');
      if (functionConsultants) {
        functionConsultants.forEach(consultant => {
          console.log(`   - ${consultant.name || consultant.email} (${consultant.role})`);
        });
      }
    }

    // 7. Check if there are any events to assign to
    console.log('\n🎪 Checking for events:');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name')
      .limit(5);

    if (eventsError) {
      console.log('❌ Error getting events:', eventsError.message);
    } else if (!events || events.length === 0) {
      console.log('⚠️ No events found');
      console.log('💡 Create some events first to test assignment');
    } else {
      console.log('✅ Found events:');
      events.forEach(event => {
        console.log(`   - ${event.name} (${event.id})`);
      });
    }

    // 8. Summary
    console.log('\n📊 Summary:');
    console.log(`   Team: ${teamMember.teams.name}`);
    console.log(`   User role: ${teamMember.role}`);
    console.log(`   Can manage: ${['owner', 'admin'].includes(teamMember.role)}`);
    console.log(`   Total team members: ${allMembers.length}`);
    console.log(`   Sales consultants: ${salesConsultants.length}`);
    console.log(`   Events available: ${events?.length || 0}`);

    if (salesConsultants.length > 0 && ['owner', 'admin'].includes(teamMember.role)) {
      console.log('\n✅ Everything looks good! The dropdown should work.');
      console.log('💡 If it\'s still not working, check the browser console for errors.');
    } else {
      console.log('\n❌ Issues found that need to be fixed:');
      if (!['owner', 'admin'].includes(teamMember.role)) {
        console.log('   - User needs owner/admin role');
      }
      if (salesConsultants.length === 0) {
        console.log('   - Need to create sales consultants');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugConsultantDropdown(); 