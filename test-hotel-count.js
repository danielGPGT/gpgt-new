import fetch from 'node-fetch';

async function testHotelData() {
  console.log('--- Testing Hotel Data Loading ---');
  
  // Test 1: Check how many hotels are loaded
  try {
    const response = await fetch('http://localhost:3001/api/search-hotels?query=test');
    const data = await response.json();
    console.log(`✅ Search endpoint working`);
    console.log(`📊 Total hotels in response: ${data.data?.length || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log('🏨 Sample hotels:');
      data.data.slice(0, 3).forEach((hotel, i) => {
        console.log(`  ${i + 1}. ${hotel.name} (${hotel.city}, ${hotel.country})`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Test 2: Search for Paris specifically
  console.log('\n--- Testing Paris Search ---');
  try {
    const parisResponse = await fetch('http://localhost:3001/api/search-hotels?query=Paris&checkIn=2025-08-22&checkOut=2025-08-29&adults=2');
    const parisData = await parisResponse.json();
    console.log(`🏨 Found ${parisData.data?.length || 0} hotels in Paris`);
    
    if (parisData.data && parisData.data.length > 0) {
      parisData.data.forEach((hotel, i) => {
        console.log(`  ${i + 1}. ${hotel.name} - ${hotel.starRating}★ - $${hotel.price}`);
      });
    }
  } catch (err) {
    console.log('❌ Paris search error:', err.message);
  }
}

testHotelData(); 