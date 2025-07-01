const clientId = '0ae72dad-c2db-4167-8c98-735e668c56ab';
const redirectUri = 'http://localhost:5173/auth/callback';
const state = Math.random().toString(36).substring(2, 15);

// Correct scopes for CRM integration
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

console.log('🔍 Testing OAuth with correct scopes...\n');
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
console.log('State:', state);
console.log('Scopes:', scopes);
console.log('');

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: scopes,
  state: state
});

const oauthUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

console.log('✅ Complete OAuth URL:');
console.log(oauthUrl);
console.log('');
console.log('💡 Instructions:');
console.log('1. Copy the URL above and test it in your browser');
console.log('2. If you still get a 400 error, the issue might be:');
console.log('   - Scopes not configured in HubSpot app');
console.log('   - App not properly set up');
console.log('   - Missing required app configuration');
console.log('');
console.log('🔧 Next steps if it fails:');
console.log('1. Go to HubSpot app settings');
console.log('2. Check that all scopes are added');
console.log('3. Verify the app is properly configured');
console.log('4. Try with minimal scopes first'); 