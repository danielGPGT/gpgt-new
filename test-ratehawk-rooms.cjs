console.log('Testing RateHawk API directly for maximum rooms...');

require('dotenv').config({ path: 'server.env' });

const API_URL = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
const API_KEY = process.env.ET_API_KEY;
const API_ID = process.env.ET_API_KEY_ID;

async function testRateHawkRooms() {
  if (!API_URL || !API_KEY || !API_ID) {
    console.error('❌ RateHawk API credentials not found');
    return;
  }

  try {
    console.log('🔍 Step 1: Searching for regions...');
    
    // Step 1: Search for regions
    const regionResponse = await fetch(`${API_URL}/search/multicomplete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${API_ID}:${API_KEY}`).toString('base64')
      },
      body: JSON.stringify({
        query: 'Paris',
        language: 'en'
      })
    });

    if (!regionResponse.ok) {
      console.error('❌ Region search failed:', regionResponse.status);
      return;
    }

    const regionData = await regionResponse.json();
    const firstRegion = regionData.data?.regions?.[0];
    
    if (!firstRegion) {
      console.error('❌ No regions found');
      return;
    }

    console.log(`✅ Found region: ${firstRegion.name} (ID: ${firstRegion.id})`);

    // Step 2: Search for hotels with higher limit
    console.log('🔍 Step 2: Searching for hotels with maximum room data...');
    
    const hotelResponse = await fetch(`${API_URL}/search/serp/region/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${API_ID}:${API_KEY}`).toString('base64')
      },
      body: JSON.stringify({
        region_id: firstRegion.id,
        checkin: '2024-12-15',
        checkout: '2024-12-17',
        guests: [{ adults: 2, children: [] }],
        hotels_limit: 5, // Limit to 5 hotels for testing
        language: 'en',
        currency: 'USD'
      })
    });

    if (!hotelResponse.ok) {
      console.error('❌ Hotel search failed:', hotelResponse.status);
      return;
    }

    const hotelData = await hotelResponse.json();
    console.log('✅ Hotel search successful');
    
    // Analyze room counts
    let maxRooms = 0;
    let totalRooms = 0;
    let hotelCount = 0;
    
    const hotels = hotelData.data?.hotels || [];
    
    hotels.forEach((hotel, index) => {
      const roomCount = hotel.rates?.length || 0;
      maxRooms = Math.max(maxRooms, roomCount);
      totalRooms += roomCount;
      hotelCount++;
      
      console.log(`\n🏨 Hotel ${index + 1}: ${hotel.name || hotel.id}`);
      console.log(`   Total rooms available: ${roomCount}`);
      console.log(`   Hotel ID: ${hotel.id}`);
      console.log(`   HID: ${hotel.hid}`);
      
      if (roomCount > 0) {
        // Show first few room types
        const roomTypes = hotel.rates.slice(0, 5).map(r => r.room_name).join(', ');
        console.log(`   Room types (first 5): ${roomTypes}`);
        
        const prices = hotel.rates.map(r => r.payment_options?.payment_types?.[0]?.amount || 0).filter(p => p > 0);
        if (prices.length > 0) {
          console.log(`   Price range: $${Math.min(...prices)} - $${Math.max(...prices)}`);
        }
        
        if (roomCount > 5) {
          console.log(`   ... and ${roomCount - 5} more room types`);
        }
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total hotels analyzed: ${hotelCount}`);
    console.log(`Total rooms across all hotels: ${totalRooms}`);
    console.log(`Maximum rooms per hotel: ${maxRooms}`);
    console.log(`Average rooms per hotel: ${(totalRooms / hotelCount).toFixed(1)}`);
    
    if (maxRooms >= 50) {
      console.log('⚠️  Some hotels have 50+ rooms - consider increasing the limit further');
    } else if (maxRooms >= 20) {
      console.log('✅ Current limit of 50 rooms is more than sufficient');
    } else {
      console.log('✅ Most hotels have fewer than 20 rooms');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRateHawkRooms(); 