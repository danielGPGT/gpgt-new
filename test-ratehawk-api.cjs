const fetch = require('node-fetch');
require('dotenv').config({ path: 'server.env' });

const ET_API_URL = process.env.ET_API_URL;
const ET_API_KEY = process.env.ET_API_KEY;
const ET_API_KEY_ID = process.env.ET_API_KEY_ID;

async function testRateHawkAPI() {
  console.log('Testing RateHawk API with credentials:');
  console.log('API URL:', ET_API_URL);
  console.log('API Key ID:', ET_API_KEY_ID);
  console.log('API Key:', ET_API_KEY ? '***' + ET_API_KEY.slice(-4) : 'NOT SET');
  console.log('');

  try {
    // Step 1: Search for regions using multicomplete
    console.log('🔍 Step 1: Searching for regions...');
    const regionPayload = {
      query: 'Paris',
      language: 'en'
    };

    console.log('Region search payload:', JSON.stringify(regionPayload, null, 2));

    const regionResponse = await fetch(`${ET_API_URL}/search/multicomplete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${ET_API_KEY_ID}:${ET_API_KEY}`).toString('base64')
      },
      body: JSON.stringify(regionPayload)
    });

    console.log('Region search response status:', regionResponse.status);

    if (!regionResponse.ok) {
      const errorText = await regionResponse.text();
      console.error('❌ Region search failed:', errorText);
      return;
    }

    const regionData = await regionResponse.json();
    console.log('✅ Region search successful!');
    console.log('Found regions:', regionData.data?.regions?.length || 0);

    if (!regionData.data?.regions || regionData.data.regions.length === 0) {
      console.error('❌ No regions found for "Paris"');
      return;
    }

    const firstRegion = regionData.data.regions[0];
    console.log('Using region:', firstRegion.name, `(ID: ${firstRegion.id})`);

    // Step 2: Search for hotels using the region ID
    console.log('\n🏨 Step 2: Searching for hotels...');
    const hotelPayload = {
      region_id: firstRegion.id,
      checkin: '2025-08-15',
      checkout: '2025-08-17',
      guests: [{ adults: 2, children: [] }],
      hotels_limit: 5,
      language: 'en',
      currency: 'USD'
    };

    console.log('Hotel search payload:', JSON.stringify(hotelPayload, null, 2));

    const hotelResponse = await fetch(`${ET_API_URL}/search/serp/region/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${ET_API_KEY_ID}:${ET_API_KEY}`).toString('base64')
      },
      body: JSON.stringify(hotelPayload)
    });

    console.log('Hotel search response status:', hotelResponse.status);

    if (!hotelResponse.ok) {
      const errorText = await hotelResponse.text();
      console.error('❌ Hotel search failed:', errorText);
      return;
    }

    const hotelData = await hotelResponse.json();
    console.log('✅ Hotel search successful!');
    console.log('Found hotels:', hotelData.data?.hotels?.length || 0);

    if (hotelData.data?.hotels && hotelData.data.hotels.length > 0) {
      const firstHotel = hotelData.data.hotels[0];
      console.log('\n📊 First hotel details:');
      console.log('- Name:', firstHotel.name || firstHotel.title);
      console.log('- ID:', firstHotel.id);
      console.log('- HID:', firstHotel.hid);
      console.log('- Available rates:', firstHotel.rates ? firstHotel.rates.length : 0);
      
      if (firstHotel.rates && firstHotel.rates.length > 0) {
        console.log('- First rate price:', firstHotel.rates[0].price?.amount, firstHotel.rates[0].price?.currency);
      }
    }

    console.log('\n📄 Full API Response Structure:');
    console.log(JSON.stringify(hotelData, null, 2));

  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
  }
}

testRateHawkAPI(); 