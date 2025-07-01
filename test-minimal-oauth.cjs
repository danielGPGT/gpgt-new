const clientId = '0ae72dad-c2db-4167-8c98-735e668c56ab';
const redirectUri = 'http://localhost:5173/auth/callback';
const state = 'test123';

// Try with minimal scope first
const minimalScopes = 'contacts';

console.log('🔍 Testing minimal OAuth...\n');
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
console.log('State:', state);
console.log('Scopes:', minimalScopes);
console.log('');

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: minimalScopes,
  state: state
});

const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

console.log('✅ Minimal OAuth URL:');
console.log(oauthUrl);
console.log('');
console.log('💡 Test this URL first with minimal scopes');
console.log('If this works, we can add more scopes gradually'); 