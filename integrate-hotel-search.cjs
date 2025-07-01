const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const ET_API_KEY_ID = process.env.ET_API_KEY_ID;
const ET_API_KEY = process.env.ET_API_KEY;

class IntegratedHotelSearch {
  constructor() {
    this.localSearch = null;
    this.dataPath = path.join(__dirname, 'data', 'hotel_index.json');
  }

  // Initialize local search if data exists
  initLocalSearch() {
    if (fs.existsSync(this.dataPath)) {
      const LocalHotelSearch = require('./search-hotels-local.cjs');
      this.localSearch = new LocalHotelSearch();
      console.log('✅ Local hotel data loaded');
      return true;
    }
    console.log('⚠️  Local hotel data not found. Run download-hotel-dump.cjs first for enhanced search.');
    return false;
  }

  // ETG API search by region
  async searchHotelsByRegion(params) {
    const {
      country,
      city,
      checkIn,
      checkOut,
      adults = 1,
      children = 0,
      rooms = 1,
      limit = 20
    } = params;

    const requestData = {
      country: country,
      city: city,
      check_in: checkIn,
      check_out: checkOut,
      adults: adults,
      children: children,
      rooms: rooms,
      limit: limit
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestData);
      
      const options = {
        hostname: 'api.worldota.net',
        path: '/api/b2b/v3/hotel/search/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${ET_API_KEY_ID}:${ET_API_KEY}`).toString('base64')}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status === 'ok' && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(`API Error: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  // Enhanced search that combines API results with local data
  async enhancedSearch(params) {
    console.log('🔍 Starting enhanced hotel search...');
    
    try {
      // Step 1: Search via ETG API
      console.log('📡 Searching via ETG API...');
      const apiResults = await this.searchHotelsByRegion(params);
      
      if (!apiResults.hotels || apiResults.hotels.length === 0) {
        console.log('❌ No hotels found via API');
        return { hotels: [], enriched: [] };
      }

      console.log(`✅ Found ${apiResults.hotels.length} hotels via API`);

      // Step 2: Enrich with local data if available
      let enrichedResults = [];
      
      if (this.initLocalSearch()) {
        console.log('🔍 Enriching results with local data...');
        
        enrichedResults = apiResults.hotels.map(hotel => {
          // Try to find matching hotel in local data
          let localData = null;
          
          // Try by hotel ID first
          if (hotel.hid) {
            localData = this.localSearch.getHotelById(hotel.hid);
          }
          
          // If not found by ID, try by name
          if (!localData && hotel.name) {
            const nameMatches = this.localSearch.searchByName(hotel.name, 1);
            if (nameMatches.length > 0) {
              localData = nameMatches[0];
            }
          }

          return {
            ...hotel,
            localData: localData,
            enriched: !!localData
          };
        });

        const enrichedCount = enrichedResults.filter(h => h.enriched).length;
        console.log(`✅ Enriched ${enrichedCount}/${enrichedResults.length} hotels with local data`);
      } else {
        // No local data available, return API results as-is
        enrichedResults = apiResults.hotels.map(hotel => ({
          ...hotel,
          localData: null,
          enriched: false
        }));
      }

      return {
        hotels: enrichedResults,
        searchParams: params,
        totalFound: enrichedResults.length,
        enrichedCount: enrichedResults.filter(h => h.enriched).length
      };

    } catch (error) {
      console.error(`❌ Enhanced search failed: ${error.message}`);
      throw error;
    }
  }

  // Search with fallback to local data only
  async searchWithFallback(params) {
    console.log('🔍 Starting search with fallback...');
    
    try {
      // Try API search first
      const apiResults = await this.enhancedSearch(params);
      
      if (apiResults.hotels.length > 0) {
        return apiResults;
      }

      // If API search fails or returns no results, try local search
      console.log('🔄 API search returned no results, trying local search...');
      
      if (this.initLocalSearch()) {
        const localResults = this.localSearch.searchByLocation(
          params.country, 
          params.city, 
          params.limit || 20
        );

        const enrichedLocalResults = localResults.map(hotel => ({
          hid: hotel.id,
          name: hotel.name,
          country: hotel.country,
          city: hotel.city,
          address: hotel.address,
          localData: hotel,
          enriched: true,
          source: 'local_only'
        }));

        return {
          hotels: enrichedLocalResults,
          searchParams: params,
          totalFound: enrichedLocalResults.length,
          enrichedCount: enrichedLocalResults.length,
          source: 'local_fallback'
        };
      }

      return { hotels: [], searchParams: params, totalFound: 0, enrichedCount: 0 };

    } catch (error) {
      console.error(`❌ Search with fallback failed: ${error.message}`);
      throw error;
    }
  }

  // Get hotel details (combines API and local data)
  async getHotelDetails(hotelId, source = 'api') {
    console.log(`🏨 Getting details for hotel ${hotelId}...`);
    
    try {
      let hotelDetails = null;
      
      if (source === 'api') {
        // Try to get details via API
        hotelDetails = await this.getHotelDetailsFromAPI(hotelId);
      }
      
      // Always try to enrich with local data if available
      if (this.initLocalSearch()) {
        const localData = this.localSearch.getHotelById(hotelId);
        
        if (localData) {
          hotelDetails = {
            ...hotelDetails,
            ...localData,
            enriched: true
          };
        }
      }
      
      return hotelDetails;
      
    } catch (error) {
      console.error(`❌ Failed to get hotel details: ${error.message}`);
      throw error;
    }
  }

  // Get hotel details from ETG API
  async getHotelDetailsFromAPI(hotelId) {
    const requestData = {
      hotel_id: hotelId
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(requestData);
      
      const options = {
        hostname: 'api.worldota.net',
        path: '/api/b2b/v3/hotel/info/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${ET_API_KEY_ID}:${ET_API_KEY}`).toString('base64')}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status === 'ok' && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(`API Error: ${response.error || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  // Get search statistics
  getSearchStats() {
    if (this.localSearch) {
      return this.localSearch.getStats();
    }
    return null;
  }
}

// Example usage and testing
async function testIntegratedSearch() {
  try {
    const search = new IntegratedHotelSearch();
    
    console.log('=== Integrated Hotel Search Test ===\n');
    
    // Test enhanced search
    const searchParams = {
      country: 'US',
      city: 'New York',
      checkIn: '2024-12-15',
      checkOut: '2024-12-17',
      adults: 2,
      children: 0,
      rooms: 1,
      limit: 5
    };

    console.log('🔍 Testing enhanced search...');
    const results = await search.enhancedSearch(searchParams);
    
    console.log(`\n📊 Search Results:`);
    console.log(`Total found: ${results.totalFound}`);
    console.log(`Enriched: ${results.enrichedCount}`);
    
    if (results.hotels.length > 0) {
      console.log('\n🏨 Sample hotels:');
      results.hotels.slice(0, 3).forEach((hotel, i) => {
        console.log(`${i + 1}. ${hotel.name || hotel.localData?.name || 'Unknown'}`);
        console.log(`   Location: ${hotel.city}, ${hotel.country}`);
        console.log(`   Enriched: ${hotel.enriched ? '✅' : '❌'}`);
        if (hotel.localData) {
          console.log(`   Chain: ${hotel.localData.chain || 'Independent'}`);
          console.log(`   Amenities: ${(hotel.localData.amenities || []).slice(0, 3).join(', ')}`);
        }
        console.log('');
      });
    }
    
    // Test fallback search
    console.log('🔄 Testing fallback search...');
    const fallbackResults = await search.searchWithFallback({
      country: 'US',
      city: 'Los Angeles',
      checkIn: '2024-12-15',
      checkOut: '2024-12-17',
      limit: 3
    });
    
    console.log(`\n📊 Fallback Results:`);
    console.log(`Total found: ${fallbackResults.totalFound}`);
    console.log(`Source: ${fallbackResults.source || 'api'}`);
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Run test if called directly
if (require.main === module) {
  testIntegratedSearch();
}

module.exports = IntegratedHotelSearch; 