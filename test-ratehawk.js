import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server.env' });

const API_URL = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
const KEY_ID = process.env.ET_API_KEY_ID;
const API_KEY = process.env.ET_API_KEY;

const today = new Date();
const checkinDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
const checkoutDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function testRateHawkCredentials() {
  console.log('🔍 Testing RateHawk API Credentials...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('- API URL:', API_URL);
  console.log('- Key ID:', KEY_ID ? '✓ Set' : '✗ Missing');
  console.log('- API Key:', API_KEY ? '✓ Set' : '✗ Missing');
  console.log('');

  if (!KEY_ID || !API_KEY) {
    console.log('❌ Missing credentials. Please check your server.env file.');
    console.log('Expected format:');
    console.log('ET_API_URL=https://api.worldota.net');
    console.log('ET_API_KEY_ID=your_key_id');
    console.log('ET_API_KEY=your_api_key');
    return;
  }

  // Test region search
  console.log('🔍 Testing Region Search...');
  try {
    const regionResponse = await fetch(`${API_URL}/search/multicomplete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${KEY_ID}:${API_KEY}`).toString('base64')
      },
      body: JSON.stringify({
        query: 'Paris',
        language: 'en'
      })
    });

    console.log('- Status:', regionResponse.status);
    console.log('- OK:', regionResponse.ok);

    if (regionResponse.ok) {
      const regionData = await regionResponse.json();
      console.log('✅ Region search successful!');
      console.log('- Found regions:', regionData.data?.regions?.length || 0);
      
      if (regionData.data?.regions?.length > 0) {
        const firstRegion = regionData.data.regions[0];
        console.log('- First region:', firstRegion.name, `(ID: ${firstRegion.id})`);
        
        // Test hotel search with the first region
        console.log('\n🏨 Testing Hotel Search...');
        const hotelResponse = await fetch(`${API_URL}/search/serp/region/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${KEY_ID}:${API_KEY}`).toString('base64')
          },
          body: JSON.stringify({
            region_id: firstRegion.id,
            checkin: formatDate(checkinDate),
            checkout: formatDate(checkoutDate),
            guests: [{ adults: 2, children: [] }],
            hotels_limit: 5,
            language: 'en',
            currency: 'USD'
          })
        });

        console.log('- Status:', hotelResponse.status);
        console.log('- OK:', hotelResponse.ok);

        if (hotelResponse.ok) {
          const hotelData = await hotelResponse.json();
          console.log('✅ Hotel search successful!');
          console.log('- Found hotels:', hotelData.data?.hotels?.length || 0);
          
          if (hotelData.data?.hotels?.length > 0) {
            const firstHotel = hotelData.data.hotels[0];
            console.log('- First hotel:', firstHotel.name || firstHotel.title);
            console.log('- Hotel ID:', firstHotel.id);
            console.log('- Hotel HID:', firstHotel.hid);
            console.log('- Hotel data keys:', Object.keys(firstHotel));
            console.log('- Full hotel data:', JSON.stringify(firstHotel, null, 2));
          }
        } else {
          const errorText = await hotelResponse.text();
          console.log('❌ Hotel search failed:', errorText);
        }
      }
    } else {
      const errorText = await regionResponse.text();
      console.log('❌ Region search failed:', errorText);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

testRateHawkCredentials(); 