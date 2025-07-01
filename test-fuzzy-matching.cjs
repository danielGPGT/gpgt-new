// Test script for fuzzy matching between RateHawk and database hotels
const { createClient } = require('@supabase/supabase-js');

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
  }
];

// Sample database hotel data (from your example)
const databaseHotels = [
  {
    id: "maison_souquet",
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

// Fuzzy matching function (copied from Edge Function)
function findBestMatch(ratehawkId, staticHotels) {
  const ratehawkName = ratehawkId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const staticHotel of staticHotels) {
    const staticName = staticHotel.name.toLowerCase();
    
    const nameSimilarity = calculateStringSimilarity(ratehawkName, staticName);
    const addressSimilarity = staticHotel.address ? 
      calculateStringSimilarity(ratehawkName, staticHotel.address.toLowerCase()) : 0;
    const citySimilarity = staticHotel.city ? 
      calculateStringSimilarity(ratehawkName, staticHotel.city.toLowerCase()) : 0;
    
    const totalScore = (nameSimilarity * 0.6) + (addressSimilarity * 0.3) + (citySimilarity * 0.1);
    
    if (totalScore > bestScore && totalScore > 0.3) {
      bestScore = totalScore;
      bestMatch = staticHotel;
    }
  }

  console.log(`🔍 Best match for "${ratehawkId}": ${bestMatch?.name || 'none'} (score: ${bestScore.toFixed(2)})`);
  return bestMatch;
}

function calculateStringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0) return str2.length === 0 ? 1.0 : 0.0;
  if (str2.length === 0) return 0.0;

  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.8;
  }

  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  const wordOverlap = commonWords.length / Math.max(words1.length, words2.length);
  
  if (wordOverlap > 0.5) {
    return wordOverlap;
  }

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

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

// Test the matching logic
console.log('🧪 Testing fuzzy matching logic...\n');

console.log('📊 RateHawk Hotels:');
ratehawkHotels.forEach(hotel => {
  console.log(`- ${hotel.id} (HID: ${hotel.hid})`);
});

console.log('\n📊 Database Hotels:');
databaseHotels.forEach(hotel => {
  console.log(`- ${hotel.id}: ${hotel.name} (${hotel.city}, ${hotel.country})`);
});

console.log('\n🔍 Testing matches...\n');

// Test each RateHawk hotel
ratehawkHotels.forEach(ratehawkHotel => {
  console.log(`\n--- Testing "${ratehawkHotel.id}" ---`);
  
  const matchedStaticHotel = findBestMatch(ratehawkHotel.id, databaseHotels);
  
  if (matchedStaticHotel) {
    console.log('✅ MATCH FOUND!');
    console.log(`RateHawk: ${ratehawkHotel.id}`);
    console.log(`Database: ${matchedStaticHotel.id} - ${matchedStaticHotel.name}`);
    
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
      rooms_count: merged.rooms.length
    });
  } else {
    console.log('❌ NO MATCH FOUND - Creating fallback');
    const fallback = createFallbackHotel(ratehawkHotel);
    console.log('📋 Fallback result:', {
      id: fallback.id,
      name: fallback.name,
      is_fallback: fallback.is_fallback,
      ratehawk_hid: fallback.ratehawk_hid
    });
  }
});

console.log('\n✅ Fuzzy matching test completed!'); 