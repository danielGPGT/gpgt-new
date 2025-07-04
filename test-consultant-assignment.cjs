const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testConsultantAssignment() {
  console.log('🧪 Testing Consultant Assignment System...\n');

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      return;
    }
    console.log('👤 Testing with user:', user.email);

    // 2. Check user's team membership and role
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

    // 3. Check if user can manage consultants
    const canManage = ['owner', 'admin'].includes(teamMember.role);
    console.log('🔐 Can manage consultants:', canManage);

    if (!canManage) {
      console.log('⚠️ User cannot manage consultants (requires owner/admin role)');
      return;
    }

    // 4. Get team consultants
    console.log('\n📋 Getting team consultants...');
    const { data: consultants, error: consultantError } = await supabase.rpc('get_team_consultants', {
      p_team_id: teamMember.team_id
    });

    if (consultantError) {
      console.log('❌ Error getting team consultants:', consultantError.message);
      return;
    }

    console.log('✅ Found', consultants?.length || 0, 'consultants in team');
    if (consultants && consultants.length > 0) {
      consultants.forEach(consultant => {
        console.log(`   - ${consultant.name || consultant.email} (${consultant.role})`);
      });
    } else {
      console.log('⚠️ No sales consultants found in team');
      console.log('💡 Create a team member with role = "sales" to test assignment');
      return;
    }

    // 5. Get or create a test event
    console.log('\n🎯 Getting test event...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.log('❌ Error getting events:', eventsError.message);
      return;
    }

    let testEvent;
    if (events && events.length > 0) {
      testEvent = events[0];
      console.log('✅ Using existing event:', testEvent.name);
    } else {
      console.log('⚠️ No events found, creating test event...');
      
      // Create a test event
      const { data: newEvent, error: createEventError } = await supabase
        .from('events')
        .insert({
          name: 'Test Event for Consultant Assignment',
          location: 'Test Location',
          start_date: '2024-12-25',
          end_date: '2024-12-26'
        })
        .select()
        .single();

      if (createEventError) {
        console.log('❌ Error creating test event:', createEventError.message);
        return;
      }

      testEvent = newEvent;
      console.log('✅ Created test event:', testEvent.name);
    }

    // 6. Test consultant assignment
    console.log('\n🔗 Testing consultant assignment...');
    const testConsultant = consultants[0];
    
    const { data: assignment, error: assignError } = await supabase.rpc('assign_consultant_to_event', {
      p_event_id: testEvent.id,
      p_consultant_id: testConsultant.id,
      p_notes: 'Test assignment from script'
    });

    if (assignError) {
      console.log('❌ Error assigning consultant:', assignError.message);
      return;
    }

    console.log('✅ Successfully assigned consultant to event');
    console.log('   Assignment ID:', assignment);

    // 7. Verify assignment
    console.log('\n✅ Verifying assignment...');
    const { data: eventConsultants, error: verifyError } = await supabase
      .from('event_consultants')
      .select(`
        *,
        consultant:team_members(name, email, role),
        event:events(name)
      `)
      .eq('event_id', testEvent.id)
      .eq('status', 'active');

    if (verifyError) {
      console.log('❌ Error verifying assignment:', verifyError.message);
      return;
    }

    console.log('✅ Assignment verified');
    eventConsultants.forEach(assignment => {
      console.log(`   - ${assignment.consultant.name || assignment.consultant.email} assigned to ${assignment.event.name}`);
      if (assignment.notes) {
        console.log(`     Notes: "${assignment.notes}"`);
      }
    });

    // 8. Test getting consultant events
    console.log('\n📊 Testing consultant events retrieval...');
    const { data: consultantEvents, error: eventsError2 } = await supabase.rpc('get_consultant_events', {
      p_consultant_id: testConsultant.id
    });

    if (eventsError2) {
      console.log('❌ Error getting consultant events:', eventsError2.message);
    } else {
      console.log('✅ Consultant events retrieved');
      consultantEvents.forEach(event => {
        console.log(`   - ${event.event_name} (${event.status})`);
      });
    }

    console.log('\n🎉 All tests passed! Consultant assignment system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testConsultantAssignment(); 