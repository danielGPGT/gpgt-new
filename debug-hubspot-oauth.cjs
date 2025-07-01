const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHubSpotOAuth() {
  try {
    console.log('🔍 Testing HubSpot OAuth configuration...\n');

    const clientId = process.env.VITE_HUBSPOT_CLIENT_ID || '0ae72dad-c2db-4167-8c98-735e668c56ab';
    const teamId = '0cef0867-1b40-4de1-9936-16b867a753d7';
    const state = Math.random().toString(36).substring(2, 15);

    // Test different redirect URIs
    const redirectUris = [
      'http://localhost:5173/auth/callback',
      'http://localhost:5173/hubspot/callback',
      'http://localhost:5173/callback',
      'http://localhost:5173/oauth/callback',
      'http://localhost:3000/auth/callback',
      'http://localhost:3000/hubspot/callback'
    ];

    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.schemas.contacts.read',
      'crm.schemas.companies.read',
      'crm.schemas.deals.read'
    ].join(' ');

    console.log('📋 Testing redirect URIs:');
    console.log('Client ID:', clientId);
    console.log('Team ID:', teamId);
    console.log('State:', state);
    console.log('Scopes:', scopes);
    console.log('');

    redirectUris.forEach((redirectUri, index) => {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: state
      });

      const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
      console.log(`${index + 1}. ${redirectUri}`);
      console.log(`   URL: ${oauthUrl}`);
      console.log('');
    });

    console.log('💡 Instructions:');
    console.log('1. Copy one of the OAuth URLs above');
    console.log('2. Open it in your browser');
    console.log('3. If you get a 400 error, that redirect URI is not configured');
    console.log('4. If you see the HubSpot authorization page, that URI works');
    console.log('');
    console.log('🔧 To fix 400 errors:');
    console.log('1. Go to https://developers.hubspot.com/');
    console.log('2. Find your app with client ID:', clientId);
    console.log('3. Go to Auth → OAuth settings');
    console.log('4. Add the working redirect URI to the allowed redirect URLs');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHubSpotOAuth(); 