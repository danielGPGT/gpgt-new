const { createClient } = require('@supabase/supabase-js');

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
    console.log('🔄 Starting logos bucket recreation...');
    
    // Step 1: List existing buckets
    console.log('📋 Checking existing buckets...');
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const logosBucket = existingBuckets.find(bucket => bucket.id === 'logos');
    if (logosBucket) {
      console.log('📦 Found existing logos bucket:', {
        id: logosBucket.id,
        name: logosBucket.name,
        public: logosBucket.public
      });
    } else {
      console.log('📦 No existing logos bucket found');
    }
    
    // Step 2: Delete existing logos bucket (if it exists)
    if (logosBucket) {
      console.log('🗑️  Deleting existing logos bucket...');
      const { error: deleteError } = await supabase
        .storage
        .deleteBucket('logos');
      
      if (deleteError) {
        console.error('❌ Error deleting logos bucket:', deleteError);
        return;
      }
      
      console.log('✅ Existing logos bucket deleted');
    }
    
    // Step 3: Create new logos bucket
    console.log('🆕 Creating new logos bucket...');
    const { data: newBucket, error: createError } = await supabase
      .storage
      .createBucket('logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
      });
    
    if (createError) {
      console.error('❌ Error creating logos bucket:', createError);
      return;
    }
    
    console.log('✅ New logos bucket created successfully!');
    console.log('📊 Bucket details:', {
      id: newBucket.id,
      name: newBucket.name,
      public: newBucket.public,
      fileSizeLimit: newBucket.file_size_limit,
      allowedMimeTypes: newBucket.allowed_mime_types
    });
    
    // Step 4: Verify the bucket was created
    console.log('🔍 Verifying bucket creation...');
    const { data: verifyBuckets, error: verifyError } = await supabase
      .storage
      .listBuckets();
    
    if (verifyError) {
      console.error('❌ Error verifying buckets:', verifyError);
      return;
    }
    
    const verifiedBucket = verifyBuckets.find(bucket => bucket.id === 'logos');
    if (verifiedBucket) {
      console.log('✅ Logos bucket verified and ready to use!');
      console.log('🎉 You can now upload team logos in the Settings → Teams tab');
    } else {
      console.error('❌ Logos bucket not found after creation');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
recreateLogosBucket(); 