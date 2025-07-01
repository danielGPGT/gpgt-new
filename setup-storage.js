// Setup script for Supabase Storage
// Run this script to initialize the storage bucket for image uploads

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('Setting up Supabase Storage...');

    // Create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('itinerary-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Storage bucket already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Storage bucket created successfully');
    }

    console.log('✅ Storage setup complete!');
    console.log('You can now upload images to your itineraries.');

  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    process.exit(1);
  }
}

setupStorage(); 