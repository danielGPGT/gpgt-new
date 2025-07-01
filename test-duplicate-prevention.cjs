const { createClient } = require('@supabase/supabase-js');

// Test the duplicate prevention logic
async function testDuplicatePrevention() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const teamId = 'your-team-id'; // Replace with actual team ID
  const userId = 'your-user-id'; // Replace with actual user ID

  console.log('Testing duplicate prevention logic...\n');

  // 1. Create a test client manually
  console.log('1. Creating test client manually...');
  const { data: manualClient, error: manualError } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      team_id: teamId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      status: 'active',
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (manualError) {
    console.error('Error creating manual client:', manualError);
    return;
  }
  console.log('✅ Manual client created:', manualClient.id);

  // 2. Simulate HubSpot sync with same email
  console.log('\n2. Simulating HubSpot sync with same email...');
  
  // Check if client exists by email
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('email', 'john.doe@example.com')
    .eq('team_id', teamId)
    .single();

  if (existingClient) {
    console.log('✅ Found existing client by email:', existingClient.id);
    console.log('✅ This would update the existing client instead of creating a duplicate');
  } else {
    console.log('❌ No existing client found - this would create a duplicate!');
  }

  // 3. Check mapping logic
  console.log('\n3. Testing mapping logic...');
  
  // Simulate creating a mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('hubspot_contact_mappings')
    .upsert({
      team_id: teamId,
      client_id: manualClient.id,
      hubspot_contact_id: 'test-hubspot-id-123',
      last_synced_at: new Date().toISOString(),
      sync_status: 'synced',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,hubspot_contact_id' })
    .select()
    .single();

  if (mappingError) {
    console.error('Error creating mapping:', mappingError);
  } else {
    console.log('✅ Mapping created:', mapping.id);
  }

  // 4. Test finding by mapping
  console.log('\n4. Testing find by mapping...');
  const { data: foundMapping } = await supabase
    .from('hubspot_contact_mappings')
    .select('client_id')
    .eq('hubspot_contact_id', 'test-hubspot-id-123')
    .eq('team_id', teamId)
    .single();

  if (foundMapping) {
    console.log('✅ Found client via mapping:', foundMapping.client_id);
    console.log('✅ This would update the existing client via mapping');
  } else {
    console.log('❌ No mapping found');
  }

  // 5. Cleanup
  console.log('\n5. Cleaning up test data...');
  await supabase
    .from('hubspot_contact_mappings')
    .delete()
    .eq('hubspot_contact_id', 'test-hubspot-id-123');
  
  await supabase
    .from('clients')
    .delete()
    .eq('id', manualClient.id);

  console.log('✅ Test data cleaned up');
  console.log('\n🎉 Duplicate prevention test completed!');
}

// Run the test
testDuplicatePrevention().catch(console.error); 