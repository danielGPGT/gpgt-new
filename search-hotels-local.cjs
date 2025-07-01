const fs = require('fs');
const path = require('path');

class LocalHotelSearch {
  constructor() {
    this.hotelIndex = null;
    this.dataPath = path.join(__dirname, 'data', 'hotel_index.json');
  }

  loadIndex() {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error('❌ Hotel index not found. Please run download-hotel-dump.js first.');
    }

    console.log('📖 Loading hotel index...');
    const data = fs.readFileSync(this.dataPath, 'utf8');
    this.hotelIndex = JSON.parse(data);
    console.log(`✅ Loaded ${this.hotelIndex.stats.total} hotels`);
    return this.hotelIndex;
  }

  searchByName(name, limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const searchTerm = name.toLowerCase();
    const results = [];

    // Search for exact matches first
    for (const [hotelName, hotels] of Object.entries(this.hotelIndex.byName)) {
      if (hotelName.includes(searchTerm)) {
        results.push(...hotels);
        if (results.length >= limit) break;
      }
    }

    // If not enough results, search for partial matches
    if (results.length < limit) {
      for (const [hotelName, hotels] of Object.entries(this.hotelIndex.byName)) {
        if (hotelName.includes(searchTerm) && !results.some(h => h.id === hotels[0].id)) {
          results.push(...hotels);
          if (results.length >= limit) break;
        }
      }
    }

    return results.slice(0, limit);
  }

  searchByLocation(country, city, limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const locationKey = `${country.toLowerCase()}_${city.toLowerCase()}`;
    const hotels = this.hotelIndex.byLocation[locationKey] || [];
    
    return hotels.slice(0, limit);
  }

  searchByChain(chain, limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const searchTerm = chain.toLowerCase();
    const results = [];

    for (const hotel of Object.values(this.hotelIndex.byId)) {
      if (hotel.chain && hotel.chain.toLowerCase().includes(searchTerm)) {
        results.push(hotel);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  getHotelById(id) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    return this.hotelIndex.byId[id] || null;
  }

  getStats() {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    return this.hotelIndex.stats;
  }

  // Advanced search with multiple criteria
  advancedSearch(criteria, limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const results = [];
    const { name, country, city, chain, amenities } = criteria;

    for (const hotel of Object.values(this.hotelIndex.byId)) {
      let matches = true;

      // Name filter
      if (name && hotel.name && !hotel.name.toLowerCase().includes(name.toLowerCase())) {
        matches = false;
      }

      // Country filter
      if (country && hotel.country && hotel.country.toLowerCase() !== country.toLowerCase()) {
        matches = false;
      }

      // City filter
      if (city && hotel.city && hotel.city.toLowerCase() !== city.toLowerCase()) {
        matches = false;
      }

      // Chain filter
      if (chain && hotel.chain && !hotel.chain.toLowerCase().includes(chain.toLowerCase())) {
        matches = false;
      }

      // Amenities filter
      if (amenities && Array.isArray(amenities)) {
        const hotelAmenities = hotel.amenities || [];
        const hasAllAmenities = amenities.every(amenity => 
          hotelAmenities.some(hotelAmenity => 
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
        if (!hasAllAmenities) {
          matches = false;
        }
      }

      if (matches) {
        results.push(hotel);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  // Get popular destinations
  getPopularDestinations(limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const cityCounts = {};
    
    for (const hotel of Object.values(this.hotelIndex.byId)) {
      if (hotel.city && hotel.country) {
        const key = `${hotel.city}, ${hotel.country}`;
        cityCounts[key] = (cityCounts[key] || 0) + 1;
      }
    }

    return Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([city, count]) => ({ city, hotelCount: count }));
  }

  // Get hotel chains
  getHotelChains(limit = 10) {
    if (!this.hotelIndex) {
      this.loadIndex();
    }

    const chainCounts = {};
    
    for (const hotel of Object.values(this.hotelIndex.byId)) {
      if (hotel.chain) {
        chainCounts[hotel.chain] = (chainCounts[hotel.chain] || 0) + 1;
      }
    }

    return Object.entries(chainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([chain, count]) => ({ chain, hotelCount: count }));
  }
}

// Example usage and testing
async function testSearch() {
  try {
    const search = new LocalHotelSearch();
    
    console.log('=== Hotel Search Test ===\n');
    
    // Get stats
    const stats = search.getStats();
    console.log('📊 Database Stats:');
    console.log(`Total hotels: ${stats.total}`);
    console.log(`Countries: ${stats.countries.length}`);
    console.log(`Cities: ${stats.cities.length}`);
    console.log(`Chains: ${stats.chains.length}\n`);
    
    // Search by name
    console.log('🔍 Searching for "Marriott"...');
    const marriottResults = search.searchByName('Marriott', 5);
    console.log(`Found ${marriottResults.length} Marriott hotels:`);
    marriottResults.forEach((hotel, i) => {
      console.log(`${i + 1}. ${hotel.name} - ${hotel.city}, ${hotel.country}`);
    });
    console.log();
    
    // Search by location
    console.log('🌍 Searching for hotels in New York, US...');
    const nyResults = search.searchByLocation('US', 'New York', 5);
    console.log(`Found ${nyResults.length} hotels in New York:`);
    nyResults.forEach((hotel, i) => {
      console.log(`${i + 1}. ${hotel.name} - ${hotel.chain || 'Independent'}`);
    });
    console.log();
    
    // Get popular destinations
    console.log('🏆 Top 5 Popular Destinations:');
    const popularDestinations = search.getPopularDestinations(5);
    popularDestinations.forEach((dest, i) => {
      console.log(`${i + 1}. ${dest.city} (${dest.hotelCount} hotels)`);
    });
    console.log();
    
    // Get top hotel chains
    console.log('🏨 Top 5 Hotel Chains:');
    const topChains = search.getHotelChains(5);
    topChains.forEach((chain, i) => {
      console.log(`${i + 1}. ${chain.chain} (${chain.hotelCount} hotels)`);
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Run test if called directly
if (require.main === module) {
  testSearch();
}

module.exports = LocalHotelSearch; 