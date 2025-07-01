const { createClient } = require('@supabase/supabase-js');

async function testEdgeFunctionEnvironment() {
  try {
    console.log('🔍 Testing Edge Function Environment Variables...\n');

    // Test the edge function directly
    const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
    
    console.log('📡 Testing hubspot-token edge function...');
    
    // This will test if the edge function is accessible
    const response = await fetch(`${supabaseUrl}/functions/v1/hubspot-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see the response
      },
      body: JSON.stringify({
        code: 'test-code',
        redirectUri: 'http://localhost:5173/auth/callback'
      })
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.status === 401) {
      console.log('✅ Edge function is accessible (401 is expected for invalid auth)');
    } else if (response.status === 500) {
      console.log('❌ Edge function has an internal error - likely missing environment variables');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEdgeFunctionEnvironment(); 