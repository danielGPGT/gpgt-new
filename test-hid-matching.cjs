// Test script for HID matching between RateHawk and database hotels
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'server.env' });

// Sample RateHawk hotel data (from your example)
const ratehawkHotels = [
  {
    id: "rila_muam_castle_hotel",
    hid: 9025546,
    rates: [
      {
        match_hash: "m-e5bd52dd-670c-5fb8-9be0-dc7e1d36be12",
        room_name: "Standard Double room (full double bed)",
        payment_options: {
          payment_types: [{ amount: "76.20", currency_code: "EUR" }]
        },
        meal_data: { value: "nomeal" }
      }
    ]
  },
  {
    id: "libertel_gare_du_nord_suede_2",
    hid: 7391436,
    rates: [
      {
        match_hash: "m-test-123",
        room_name: "Comfort room with courtyard view",
        payment_options: {
          payment_types: [{ amount: "321.00", currency_code: "GBP" }]
        },
        meal_data: { value: "nomeal" }
      }
    ]
  }
];

// Sample database hotel data (from your example)
const databaseHotels = [
  {
    id: "maison_souquet",
    hid: 9025546, // Same HID as RateHawk hotel
    name: "Maison Souquet, Hotel & Spa",
    address: "10 Rue De Bruxelles, Paris",
    city: "Paris",
    country: "FR",
    region_id: "2734",
    latitude: "48.883537",
    longitude: "2.331531",
    amenities: ["Computer", "Air conditioning", "24-hour reception"],
    star_rating: "5",
    hotel_chain: "No chain",
    kind: "Resort",
    images: ["https://cdn.worldota.net/t/{size}/content/99/66/99669b868c3bf256d3aeef5c9540d11a9153bd4e.jpeg"],
    is_closed: "false"
  }
];

// Direct HID matching function (copied from Edge Function)
function findHotelByHID(hid, staticHotels) {
  return staticHotels.find(hotel => hotel.hid === hid);
}

// Create a fallback hotel object when no match is found
function createFallbackHotel(ratehawkHotel) {
  const readableName = ratehawkHotel.id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    id: ratehawkHotel.id,
    name: readableName,
    rating: 4.0,
    stars: 3,
    address: {
      country: 'Unknown',
      city: 'Unknown',
      street: 'Unknown',
      zip: 'Unknown'
    },
    location: {
      latitude: 0,
      longitude: 0
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
    ],
    amenities: ['WiFi', 'Basic amenities'],
    description: `Hotel ${readableName}`,
    rooms: ratehawkHotel.rates,
    is_fallback: true,
    ratehawk_hid: ratehawkHotel.hid,
  };
}

// Test the HID matching logic
console.log('🧪 Testing HID matching logic...\n');

console.log('📊 RateHawk Hotels:');
ratehawkHotels.forEach(hotel => {
  console.log(`- ${hotel.id} (HID: ${hotel.hid})`);
});

console.log('\n📊 Database Hotels:');
databaseHotels.forEach(hotel => {
  console.log(`- ${hotel.id}: ${hotel.name} (HID: ${hotel.hid})`);
});

console.log('\n🔍 Testing HID matches...\n');

// Test each RateHawk hotel
ratehawkHotels.forEach(ratehawkHotel => {
  console.log(`\n--- Testing "${ratehawkHotel.id}" (HID: ${ratehawkHotel.hid}) ---`);
  
  const matchedStaticHotel = findHotelByHID(ratehawkHotel.hid, databaseHotels);
  
  if (matchedStaticHotel) {
    console.log('✅ HID MATCH FOUND!');
    console.log(`RateHawk: ${ratehawkHotel.id} (HID: ${ratehawkHotel.hid})`);
    console.log(`Database: ${matchedStaticHotel.id} - ${matchedStaticHotel.name} (HID: ${matchedStaticHotel.hid})`);
    
    // Create merged result
    const merged = {
      ...matchedStaticHotel,
      ratehawk_id: ratehawkHotel.id,
      ratehawk_hid: ratehawkHotel.hid,
      rooms: ratehawkHotel.rates.map(room => ({
        id: room.match_hash,
        name: room.room_name,
        price: {
          amount: room.payment_options?.payment_types?.[0]?.amount || 0,
          currency: room.payment_options?.payment_types?.[0]?.currency_code || 'USD'
        },
        refundable: true,
        available: true,
        boardType: room.meal_data?.value || 'Room Only',
      }))
    };
    
    console.log('📋 Merged result:', {
      id: merged.id,
      name: merged.name,
      ratehawk_id: merged.ratehawk_id,
      ratehawk_hid: merged.ratehawk_hid,
      rooms_count: merged.rooms.length,
      has_rich_data: !!merged.images && merged.images.length > 0
    });
  } else {
    console.log('❌ NO HID MATCH FOUND - Creating fallback');
    const fallback = createFallbackHotel(ratehawkHotel);
    console.log('📋 Fallback result:', {
      id: fallback.id,
      name: fallback.name,
      is_fallback: fallback.is_fallback,
      ratehawk_hid: fallback.ratehawk_hid
    });
  }
});

console.log('\n✅ HID matching test completed!');
console.log('\n💡 Benefits of HID matching:');
console.log('- 100% accurate matching (no false positives)');
console.log('- Much faster than fuzzy string matching');
console.log('- No need for similarity thresholds');
console.log('- Direct database lookup by indexed HID field'); 