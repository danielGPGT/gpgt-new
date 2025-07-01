// Test script for RateHawk integration
import fetch from 'node-fetch';

async function testRateHawkIntegration() {
  console.log('🧪 Testing RateHawk Integration...\n');

  // Test 1: Check if server is running
  console.log('1️⃣ Testing server health...');
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Server not running. Please start the server with: npm run server');
    return;
  }

  // Test 2: Test hotel search endpoint
  console.log('\n2️⃣ Testing hotel search...');
  try {
    const searchResponse = await fetch('http://localhost:3001/api/search-hotels?query=Paris&checkIn=2024-12-15&checkOut=2024-12-18&adults=2&children=0&rooms=1');
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      console.log('✅ Hotel search successful');
      console.log(`📊 Found ${data.data.length} hotels`);
      
      if (data.data.length > 0) {
        const firstHotel = data.data[0];
        console.log(`🏨 First hotel: ${firstHotel.name}`);
        console.log(`📍 Location: ${firstHotel.city}, ${firstHotel.country}`);
        console.log(`⭐ Rating: ${firstHotel.starRating} stars`);
      }
    } else {
      console.log('❌ Hotel search failed');
      const errorText = await searchResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Hotel search error:', error.message);
  }

  // Test 3: Test with different parameters
  console.log('\n3️⃣ Testing with different parameters...');
  try {
    const searchResponse2 = await fetch('http://localhost:3001/api/search-hotels?query=New York&checkIn=2024-12-20&checkOut=2024-12-23&adults=1&children=0&rooms=1');
    
    if (searchResponse2.ok) {
      const data = await searchResponse2.json();
      console.log('✅ Second search successful');
      console.log(`📊 Found ${data.data.length} hotels for New York`);
    } else {
      console.log('❌ Second search failed');
    }
  } catch (error) {
    console.log('❌ Second search error:', error.message);
  }

  console.log('\n🎉 RateHawk integration test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Navigate to: http://localhost:5173/ratehawk-test');
  console.log('3. Check the browser console for debugging information');
}

testRateHawkIntegration(); 