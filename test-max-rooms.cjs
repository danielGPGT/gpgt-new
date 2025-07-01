console.log('Testing maximum number of hotel rooms from RateHawk API...');

require('dotenv').config({ path: 'server.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcnpsd2pjemdza2JjeGt4eGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTUyMzYsImV4cCI6MjA2NTgzMTIzNn0.psjRoqs52gTsKRSBeHLPB57NWpv5U890t3BHmW7iaw4';

async function testMaxRooms() {
  try {
    console.log('🔍 Making request to Supabase Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-hotels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        destination: 'Paris',
        checkIn: '2024-12-15',
        checkOut: '2024-12-17',
        adults: 2,
        children: 0,
        rooms: 1,
        currency: 'USD',
        language: 'en'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received successfully');
    
    // Analyze room counts
    let maxRooms = 0;
    let totalRooms = 0;
    let hotelCount = 0;
    
    data.hotels.forEach((hotel, index) => {
      const roomCount = hotel.rooms?.length || 0;
      maxRooms = Math.max(maxRooms, roomCount);
      totalRooms += roomCount;
      hotelCount++;
      
      console.log(`🏨 Hotel ${index + 1}: ${hotel.name} - ${roomCount} rooms`);
      
      if (roomCount > 0) {
        console.log(`   Room types: ${hotel.rooms.map(r => r.name).join(', ')}`);
        console.log(`   Price range: $${Math.min(...hotel.rooms.map(r => r.price.amount))} - $${Math.max(...hotel.rooms.map(r => r.price.amount))}`);
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total hotels: ${hotelCount}`);
    console.log(`Total rooms across all hotels: ${totalRooms}`);
    console.log(`Maximum rooms per hotel: ${maxRooms}`);
    console.log(`Average rooms per hotel: ${(totalRooms / hotelCount).toFixed(1)}`);
    
    if (maxRooms >= 50) {
      console.log('⚠️  Some hotels may have more than 50 rooms - consider increasing the limit further');
    } else {
      console.log('✅ Current limit of 50 rooms should be sufficient');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMaxRooms(); 