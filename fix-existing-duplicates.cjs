const { createClient } = require('@supabase/supabase-js');

// Find and fix existing duplicate clients
async function fixExistingDuplicates() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Finding duplicate clients...\n');

  // Find clients with duplicate emails within the same team
  const { data: duplicates, error } = await supabase
    .rpc('find_duplicate_clients_by_email');

  if (error) {
    console.error('Error finding duplicates:', error);
    return;
  }

  if (!duplicates || duplicates.length === 0) {
    console.log('✅ No duplicate clients found!');
    return;
  }

  console.log(`Found ${duplicates.length} groups of duplicate clients:\n`);

  for (const group of duplicates) {
    console.log(`Team: ${group.team_id}, Email: ${group.email}`);
    console.log(`Duplicate IDs: ${group.client_ids.join(', ')}`);
    
    // Keep the oldest client, delete the rest
    const clientIds = group.client_ids.sort();
    const keepId = clientIds[0]; // Keep the first one (oldest)
    const deleteIds = clientIds.slice(1); // Delete the rest
    
    console.log(`Keeping: ${keepId}`);
    console.log(`Deleting: ${deleteIds.join(', ')}`);
    
    // Delete duplicate clients
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .in('id', deleteIds);
    
    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
    } else {
      console.log('✅ Duplicates deleted successfully');
    }
    
    console.log('---');
  }

  console.log('\n🎉 Duplicate cleanup completed!');
}

// Run the cleanup
fixExistingDuplicates().catch(console.error); 