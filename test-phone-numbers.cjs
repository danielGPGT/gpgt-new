const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPhoneNumbers() {
  console.log('📞 Testing Phone Number Integration...\n');

  try {
    // 1. Check if phone column exists in team_members
    console.log('1. Checking team_members table structure...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'team_members')
      .eq('table_schema', 'public');

    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return;
    }

    const hasPhoneColumn = columns.some(col => col.column_name === 'phone');
    console.log(hasPhoneColumn ? '✅ Phone column exists' : '❌ Phone column missing');

    // 2. Get team members with phone numbers
    console.log('\n2. Fetching team members with phone numbers...');
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('id, name, email, phone, role')
      .eq('role', 'sales')
      .limit(5);

    if (membersError) {
      console.error('❌ Error fetching team members:', membersError);
      return;
    }

    console.log(`Found ${teamMembers.length} sales team members:`);
    teamMembers.forEach(member => {
      console.log(`  - ${member.name || member.email} (${member.role})`);
      console.log(`    📞 Phone: ${member.phone || 'Not set'}`);
    });

    // 3. Test event consultants query with phone numbers
    console.log('\n3. Testing event consultants query with phone numbers...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        name,
        event_consultants(
          id,
          consultant_id,
          assigned_at,
          notes,
          status,
          consultant:team_members(
            id,
            name,
            email,
            phone,
            role
          )
        )
      `)
      .limit(3);

    if (eventsError) {
      console.error('❌ Error fetching events with consultants:', eventsError);
      return;
    }

    console.log(`Found ${events.length} events with consultants:`);
    events.forEach(event => {
      console.log(`\n📅 Event: ${event.name}`);
      if (event.event_consultants && event.event_consultants.length > 0) {
        event.event_consultants.forEach(assignment => {
          const consultant = assignment.consultant;
          console.log(`  👤 Consultant: ${consultant?.name || consultant?.email}`);
          console.log(`    📞 Phone: ${consultant?.phone || 'Not set'}`);
          console.log(`    🏷️  Role: ${consultant?.role}`);
          console.log(`    📝 Notes: ${assignment.notes || 'None'}`);
        });
      } else {
        console.log('  ❌ No consultants assigned');
      }
    });

    // 4. Update a test team member with phone number
    if (teamMembers.length > 0) {
      console.log('\n4. Adding phone number to test team member...');
      const testMember = teamMembers[0];
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ phone: '+44 7700 900000' })
        .eq('id', testMember.id);

      if (updateError) {
        console.error('❌ Error updating phone number:', updateError);
      } else {
        console.log(`✅ Added phone number to ${testMember.name || testMember.email}`);
      }
    }

    console.log('\n✅ Phone number integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPhoneNumbers(); 