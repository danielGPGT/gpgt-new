const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestConsultant() {
  console.log('👥 Creating Test Consultant...\n');

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      console.log('💡 Please login first or set up authentication');
      return;
    }
    console.log('👤 Current user:', user.email);

    // 2. Get user's team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('*, teams(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (teamError || !teamMember) {
      console.log('❌ User is not a team member');
      console.log('💡 Please ensure user is part of a team');
      return;
    }

    console.log('✅ Found team:', teamMember.teams.name);
    console.log('👑 User role:', teamMember.role);

    // 3. Check if user can create consultants
    if (!['owner', 'admin'].includes(teamMember.role)) {
      console.log('❌ User cannot create consultants (requires owner/admin role)');
      return;
    }

    // 4. Check if test consultant already exists
    const { data: existingConsultant } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamMember.team_id)
      .eq('email', 'test-consultant@example.com')
      .single();

    if (existingConsultant) {
      console.log('⚠️ Test consultant already exists');
      console.log('   Name:', existingConsultant.name);
      console.log('   Role:', existingConsultant.role);
      console.log('   Status:', existingConsultant.status);
      
      if (existingConsultant.role !== 'sales') {
        console.log('🔄 Updating role to sales...');
        const { error: updateError } = await supabase
          .from('team_members')
          .update({ role: 'sales' })
          .eq('id', existingConsultant.id);
        
        if (updateError) {
          console.log('❌ Error updating role:', updateError.message);
          return;
        }
        console.log('✅ Role updated to sales');
      }
      
      return;
    }

    // 5. Create test consultant
    console.log('➕ Creating test consultant...');
    const { data: newConsultant, error: createError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamMember.team_id,
        email: 'test-consultant@example.com',
        name: 'Test Consultant',
        role: 'sales',
        status: 'active',
        invited_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating consultant:', createError.message);
      return;
    }

    console.log('✅ Test consultant created successfully!');
    console.log('   Name:', newConsultant.name);
    console.log('   Email:', newConsultant.email);
    console.log('   Role:', newConsultant.role);
    console.log('   Team:', teamMember.teams.name);

    // 6. Verify consultant appears in team consultants
    console.log('\n🔍 Verifying consultant appears in team consultants...');
    const { data: teamConsultants, error: verifyError } = await supabase.rpc('get_team_consultants', {
      p_team_id: teamMember.team_id
    });

    if (verifyError) {
      console.log('❌ Error getting team consultants:', verifyError.message);
    } else {
      console.log('✅ Team consultants found:', teamConsultants.length);
      teamConsultants.forEach(consultant => {
        console.log(`   - ${consultant.name || consultant.email} (${consultant.role})`);
      });
    }

    console.log('\n🎉 Test consultant is ready for assignment!');
    console.log('💡 You can now assign this consultant to events in the event forms');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
createTestConsultant(); 