import dotenv from 'dotenv';
dotenv.config({ path: './server.env' });

import fetch from 'node-fetch';

// Test hotel content extraction
async function testHotelContent() {
  const hotelId = 7576707; // Updated to valid numeric HID from search
  const keyId = process.env.ET_API_KEY_ID;
  const apiKey = process.env.ET_API_KEY;
  const apiUrl = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';

  if (!keyId || !apiKey) {
    console.error('Missing ET_API_KEY_ID or ET_API_KEY environment variables');
    return;
  }

  try {
    console.log('Testing hotel content API...');
    
    const response = await fetch(`${apiUrl}/static/hotels/${hotelId}/content/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64')
      }
    });

    if (!response.ok) {
      throw new Error(`Hotel content API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok' || !data.data) {
      throw new Error('Invalid hotel content response');
    }

    const hotel = data.data;
    
    console.log('\n=== HOTEL CONTENT EXTRACTION TEST ===');
    console.log(`Hotel Name: ${hotel.name}`);
    console.log(`Star Rating: ${hotel.star_rating}`);
    console.log(`Hotel Chain: ${hotel.hotel_chain}`);
    console.log(`Kind: ${hotel.kind}`);
    console.log(`Address: ${hotel.address}`);
    console.log(`Phone: ${hotel.phone}`);
    console.log(`Email: ${hotel.email}`);
    console.log(`Check-in: ${hotel.check_in_time}`);
    console.log(`Check-out: ${hotel.check_out_time}`);
    console.log(`Is Closed: ${hotel.is_closed}`);
    
    console.log('\n=== IMAGES ===');
    console.log(`Total Images: ${hotel.images?.length || 0}`);
    if (hotel.images && hotel.images.length > 0) {
      console.log(`First Image: ${hotel.images[0]}`);
    }
    
    console.log('\n=== AMENITIES ===');
    const allAmenities = hotel.amenity_groups?.flatMap(group => group.amenities) || [];
    console.log(`Total Amenities: ${allAmenities.length}`);
    console.log('Amenities:', allAmenities.slice(0, 10));
    
    console.log('\n=== SERP FILTERS ===');
    console.log('SERP Filters:', hotel.serp_filters || []);
    
    console.log('\n=== PAYMENT METHODS ===');
    console.log('Payment Methods:', hotel.payment_methods || []);
    
    console.log('\n=== ROOM GROUPS ===');
    console.log(`Total Room Groups: ${hotel.room_groups?.length || 0}`);
    
    console.log('\n=== REGION INFO ===');
    if (hotel.region) {
      console.log(`Country: ${hotel.region.country_code}`);
      console.log(`City: ${hotel.region.name}`);
      console.log(`IATA: ${hotel.region.iata}`);
    }
    
    console.log('\n=== PROCESSED DATA ===');
    
    // Process images
    const processedImages = (hotel.images || []).map(img => 
      img.replace('{size}', '800x600')
    );
    console.log(`Processed Images: ${processedImages.length}`);
    
    // Extract star rating
    const starRating = hotel.star_rating !== null && hotel.star_rating !== undefined ? hotel.star_rating : 3;
    console.log(`Processed Star Rating: ${starRating}`);
    
    // Extract SERP filters for additional amenities
    const serpFilters = hotel.serp_filters || [];
    const serpFilterAmenities = serpFilters.map(filter => {
      const filterMap = {
        'has_internet': 'Internet access',
        'has_parking': 'Parking',
        'has_spa': 'Spa',
        'has_pets': 'Pets allowed',
        'has_jacuzzi': 'Jacuzzi',
        'kitchen': 'Kitchen',
        'has_pool': 'Pool',
        'has_gym': 'Gym',
        'has_restaurant': 'Restaurant'
      };
      return filterMap[filter] || filter;
    });
    
    // Combine amenities
    const combinedAmenities = [...new Set([...allAmenities, ...serpFilterAmenities])];
    console.log(`Combined Amenities: ${combinedAmenities.length}`);
    console.log('Combined Amenities:', combinedAmenities.slice(0, 10));
    
    console.log('\n✅ Hotel content extraction test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHotelContent(); 