const fetch = require('node-fetch');

async function testLogoFetch() {
  const logoUrl = "https://uesuuvzjirdudiwtalwv.supabase.co/storage/v1/object/public/logos/teams/0cef0867-1b40-4de1-9936-16b867a753d7/1752251355215-netl8dtdern.svg";
  
  try {
    console.log('Testing logo fetch from:', logoUrl);
    const response = await fetch(logoUrl);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const buffer = await response.buffer();
      console.log('Image size:', buffer.length, 'bytes');
      console.log('First 100 characters:', buffer.toString('utf8').substring(0, 100));
    } else {
      console.log('Failed to fetch image');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogoFetch(); 