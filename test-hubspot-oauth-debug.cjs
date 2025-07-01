const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHubSpotOAuthFlow() {
  try {
    console.log('🔍 Testing HubSpot OAuth Flow...\n');

    // Test 1: Check if we can generate a valid OAuth URL
    const clientId = '0ae72dad-c2db-4167-8c98-735e668c56ab';
    const redirectUri = 'http://localhost:5173/auth/callback';
    const state = Math.random().toString(36).substring(2, 15);
    const teamId = '0cef0867-1b40-4de1-9936-16b867a753d7';

    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.custom.read',
      'crm.objects.custom.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'oauth'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state: state
    });

    const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

    console.log('✅ OAuth URL generated:');
    console.log(oauthUrl);
    console.log('');

    // Test 2: Check if the redirect URI is configured in HubSpot
    console.log('🔧 To test the OAuth flow:');
    console.log('1. Copy the OAuth URL above');
    console.log('2. Open it in your browser');
    console.log('3. If you get a 400 error, the redirect URI is not configured');
    console.log('4. If you see the HubSpot authorization page, the URI is correct');
    console.log('');

    // Test 3: Check if the edge function is accessible
    console.log('🔍 Testing edge function accessibility...');
    
    // Note: This would require a valid session token
    console.log('To test the edge function, you need to:');
    console.log('1. Complete the OAuth flow in the browser');
    console.log('2. Check the browser console for any errors');
    console.log('3. Check the Supabase edge function logs');
    console.log('');

    // Test 4: Check common issues
    console.log('🚨 Common issues that could cause OAuth to fail:');
    console.log('1. Redirect URI mismatch between app config and OAuth URL');
    console.log('2. Missing or incorrect scopes');
    console.log('3. Edge function environment variables not set');
    console.log('4. HubSpot app configuration changes');
    console.log('5. Network/CORS issues');
    console.log('6. State parameter validation failure');
    console.log('');

    console.log('💡 Next steps:');
    console.log('1. Test the OAuth URL in browser');
    console.log('2. Check browser console for errors');
    console.log('3. Check Supabase edge function logs');
    console.log('4. Verify HubSpot app configuration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHubSpotOAuthFlow(); 