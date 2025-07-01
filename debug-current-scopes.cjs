const clientId = process.env.VITE_HUBSPOT_CLIENT_ID || '0ae72dad-c2db-4167-8c98-735e668c56ab';
const redirectUri = 'http://localhost:5173/auth/callback';

// Current scopes in the code
const currentScopes = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.custom.read',
  'crm.objects.custom.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'oauth'
].join(' ');

// What you said is configured in HubSpot
const configuredScopes = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write', 
  'crm.objects.custom.read',
  'crm.objects.custom.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'oauth'
].join(' ');

console.log('🔍 Debugging Scope Mismatch:');
console.log('');
console.log('📋 Current code scopes:');
console.log(currentScopes);
console.log('');
console.log('📋 Configured HubSpot scopes:');
console.log(configuredScopes);
console.log('');
console.log('🔍 Scopes match:', currentScopes === configuredScopes);
console.log('');

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: currentScopes,
  state: 'debug123'
});

const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

console.log('🔗 Current OAuth URL:');
console.log(oauthUrl);
console.log('');
console.log('📝 Instructions:');
console.log('1. Copy the OAuth URL above');
console.log('2. Open it in your browser');
console.log('3. Check if you still get the scope mismatch error');
console.log('4. If you do, there might be a caching issue or the scopes aren\'t saved properly in HubSpot'); 