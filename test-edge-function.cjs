const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
  try {
    console.log('🧪 Testing HubSpot Edge Function...');
    
    // First, get a session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('❌ No active session found. Please log in first.');
      return;
    }

    console.log('✅ Session found, testing Edge Function...');

    // Test the Edge Function with dummy data
    const response = await fetch(`${supabaseUrl}/functions/v1/hubspot-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'test_code',
        redirectUri: 'http://localhost:5173/auth/callback'
      })
    });

    console.log('📡 Response status:', response.status);
    
    const result = await response.json();
    console.log('📄 Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Edge Function is accessible');
    } else {
      console.log('❌ Edge Function returned an error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEdgeFunction(); 