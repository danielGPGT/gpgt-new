// Test script to call the updated Edge Function with fuzzy matching
const fetch = require('node-fetch');

async function testFuzzySearch() {
  const supabaseUrl = 'https://borzlwjczgskbcxkxxei.supabase.co';
  const functionUrl = `${supabaseUrl}/functions/v1/search-hotels`;
  
  // Use the actual anon key from server.env
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcnpsd2pjemdza2JjeGt4eGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTUyMzYsImV4cCI6MjA2NTgzMTIzNn0.psjRoqs52gTsKRSBeHLPB57NWpv5U890t3BHmW7iaw4';
  
  const searchPayload = {
    destination: "Paris",
    checkIn: "2025-10-22",
    checkOut: "2025-10-25", 
    adults: 2,
    children: 0,
    rooms: 1,
    currency: "EUR",
    language: "en"
  };

  console.log('🧪 Testing fuzzy matching with real search...\n');
  console.log('📤 Search payload:', JSON.stringify(searchPayload, null, 2));
  console.log('\n🔄 Calling Edge Function...\n');

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(searchPayload)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Search successful!');
    console.log(`📊 Found ${data.hotels?.length || 0} hotels\n`);

    if (data.hotels && data.hotels.length > 0) {
      console.log('🏨 Hotel Results:');
      data.hotels.forEach((hotel, index) => {
        console.log(`\n--- Hotel ${index + 1} ---`);
        console.log(`ID: ${hotel.id}`);
        console.log(`Name: ${hotel.name}`);
        console.log(`RateHawk ID: ${hotel.ratehawk_id || 'N/A'}`);
        console.log(`RateHawk HID: ${hotel.ratehawk_hid || 'N/A'}`);
        console.log(`Is Fallback: ${hotel.is_fallback || false}`);
        console.log(`Rating: ${hotel.rating || 'N/A'}`);
        console.log(`Stars: ${hotel.stars || hotel.star_rating || 'N/A'}`);
        console.log(`City: ${hotel.city || hotel.address?.city || 'N/A'}`);
        console.log(`Country: ${hotel.country || hotel.address?.country || 'N/A'}`);
        console.log(`Rooms available: ${hotel.rooms?.length || 0}`);
        
        if (hotel.rooms && hotel.rooms.length > 0) {
          console.log('💰 Room prices:');
          hotel.rooms.forEach((room, roomIndex) => {
            console.log(`  ${roomIndex + 1}. ${room.name}: ${room.price?.amount} ${room.price?.currency}`);
          });
        }
      });
    } else {
      console.log('❌ No hotels found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFuzzySearch(); 