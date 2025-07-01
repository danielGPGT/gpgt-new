const clientId = '0ae72dad-c2db-4167-8c98-735e668c56ab';

// Test different redirect URIs that might be configured
const redirectUris = [
  'http://localhost:5173/callback',
  'http://localhost:3000/callback',
  'http://localhost:5173/oauth/callback',
  'http://localhost:3000/oauth/callback',
  'http://localhost:5173/hubspot/callback',
  'http://localhost:3000/hubspot/callback'
];

console.log('🔍 Testing different redirect URIs...\n');

redirectUris.forEach((redirectUri, index) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'contacts',
    state: 'test123'
  });

  const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  console.log(`${index + 1}. Test: ${redirectUri}`);
  console.log(`   URL: ${oauthUrl}`);
  console.log('');
});

console.log('💡 Instructions:');
console.log('1. Copy each URL and test it in your browser');
console.log('2. If you see a HubSpot authorization page, that URI is configured');
console.log('3. If you get a 400 error, that URI is not configured');
console.log('4. Once you find a working URI, we can update the code to use it'); 