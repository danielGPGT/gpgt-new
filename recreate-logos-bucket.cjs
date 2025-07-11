const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recreateLogosBucket() {
  try {
    console.log('🔄 Recreating logos bucket...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'recreate-logos-bucket.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Logos bucket recreated successfully!');
    console.log('📊 Bucket details:', data);
    
    // Verify the bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }
    
    const logosBucket = buckets.find(bucket => bucket.id === 'logos');
    if (logosBucket) {
      console.log('✅ Logos bucket verified:', {
        id: logosBucket.id,
        name: logosBucket.name,
        public: logosBucket.public,
        fileSizeLimit: logosBucket.file_size_limit,
        allowedMimeTypes: logosBucket.allowed_mime_types
      });
    } else {
      console.error('❌ Logos bucket not found after recreation');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
recreateLogosBucket(); 