import fetch from 'node-fetch';

async function testRateHawkAPI() {
  try {
    console.log('Testing RateHawk API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/search-hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: 'Paris',
        checkIn: '2024-12-15',
        checkOut: '2024-12-20',
        adults: 2,
        children: 0,
        rooms: 1,
        currency: 'USD',
        language: 'en'
      }),
    });

    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\nHotel count:', data.data.hotels?.length || 0);
      console.log('Total results:', data.data.totalResults);
      console.log('Search ID:', data.data.searchId);
      
      if (data.data.hotels && data.data.hotels.length > 0) {
        console.log('\nFirst hotel:');
        console.log('- Name:', data.data.hotels[0].name);
        console.log('- Rating:', data.data.hotels[0].rating);
        console.log('- Stars:', data.data.hotels[0].stars);
        console.log('- Rooms available:', data.data.hotels[0].rooms?.length || 0);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testRateHawkAPI(); 