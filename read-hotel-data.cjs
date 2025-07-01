console.log('[INFO] Hotel data reader started...');
const fs = require('fs');
const readline = require('readline');

const HOTEL_FILE = './hotel-data/hotel_dump_en.json';
const OUTPUT_FILE = './hotel-data/hotel_summary.json';

// Check if file exists
if (!fs.existsSync(HOTEL_FILE)) {
  console.error(`[ERROR] Hotel file not found: ${HOTEL_FILE}`);
  process.exit(1);
}

console.log(`[INFO] Reading hotel data from: ${HOTEL_FILE}`);

// Function to analyze hotel data
async function analyzeHotelData() {
  const readStream = fs.createReadStream(HOTEL_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let validHotels = 0;
  let starRatings = {};
  let countries = {};
  let hotelTypes = {};
  let sampleHotels = [];

  console.log('[INFO] Analyzing hotel data...');

  for await (const line of rl) {
    lineCount++;
    
    if (!line.trim()) continue;
    
    try {
      const hotel = JSON.parse(line);
      validHotels++;
      
      // Count star ratings
      const stars = hotel.star_rating || 0;
      starRatings[stars] = (starRatings[stars] || 0) + 1;
      
      // Count countries
      if (hotel.region && hotel.region.country_code) {
        const country = hotel.region.country_code;
        countries[country] = (countries[country] || 0) + 1;
      }
      
      // Count hotel types
      const type = hotel.kind || 'Unknown';
      hotelTypes[type] = (hotelTypes[type] || 0) + 1;
      
      // Save sample hotels (first 5 with different star ratings)
      if (sampleHotels.length < 5 && hotel.star_rating >= 3) {
        sampleHotels.push({
          id: hotel.id,
          name: hotel.name,
          star_rating: hotel.star_rating,
          country: hotel.region?.country_code,
          city: hotel.region?.name,
          type: hotel.kind,
          amenities_count: hotel.amenity_groups?.length || 0,
          images_count: hotel.images?.length || 0
        });
      }
      
      // Progress indicator
      if (lineCount % 100000 === 0) {
        console.log(`[PROGRESS] Processed ${lineCount} lines, found ${validHotels} valid hotels...`);
      }
      
    } catch (error) {
      console.error(`[ERROR] Failed to parse line ${lineCount}:`, error.message);
    }
  }

  // Create summary
  const summary = {
    total_lines: lineCount,
    valid_hotels: validHotels,
    star_ratings: starRatings,
    countries: Object.fromEntries(
      Object.entries(countries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20) // Top 20 countries
    ),
    hotel_types: hotelTypes,
    sample_hotels: sampleHotels,
    analysis_date: new Date().toISOString()
  };

  // Save summary
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summary, null, 2));
  
  console.log('\n[SUMMARY] Hotel data analysis completed!');
  console.log(`[SUMMARY] Total lines processed: ${lineCount}`);
  console.log(`[SUMMARY] Valid hotels found: ${validHotels}`);
  console.log(`[SUMMARY] Star rating distribution:`);
  Object.entries(starRatings).forEach(([stars, count]) => {
    const percentage = ((count / validHotels) * 100).toFixed(1);
    console.log(`[SUMMARY]   ${stars} stars: ${count} hotels (${percentage}%)`);
  });
  console.log(`[SUMMARY] Top 5 countries:`);
  Object.entries(summary.countries).slice(0, 5).forEach(([country, count]) => {
    console.log(`[SUMMARY]   ${country}: ${count} hotels`);
  });
  console.log(`[SUMMARY] Hotel types:`);
  Object.entries(hotelTypes).forEach(([type, count]) => {
    console.log(`[SUMMARY]   ${type}: ${count} hotels`);
  });
  console.log(`[SUMMARY] Summary saved to: ${OUTPUT_FILE}`);
}

// Function to search hotels by criteria
async function searchHotels(criteria = {}) {
  const { minStars = 3, country = null, limit = 10 } = criteria;
  
  console.log(`[INFO] Searching hotels with criteria: minStars=${minStars}, country=${country || 'any'}, limit=${limit}`);
  
  const readStream = fs.createReadStream(HOTEL_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  let found = 0;
  const results = [];

  for await (const line of rl) {
    if (found >= limit) break;
    
    if (!line.trim()) continue;
    
    try {
      const hotel = JSON.parse(line);
      
      // Apply filters
      if (hotel.star_rating < minStars) continue;
      if (country && hotel.region?.country_code !== country) continue;
      
      results.push({
        id: hotel.id,
        name: hotel.name,
        star_rating: hotel.star_rating,
        country: hotel.region?.country_code,
        city: hotel.region?.name,
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        amenities: hotel.amenity_groups?.flatMap(g => g.amenities || []) || [],
        images_count: hotel.images?.length || 0
      });
      
      found++;
      
    } catch (error) {
      // Skip invalid lines
    }
  }

  console.log(`[SEARCH] Found ${found} hotels matching criteria`);
  return results;
}

// Main execution
async function main() {
  try {
    // Analyze the data
    await analyzeHotelData();
    
    // Search for some example hotels
    console.log('\n[INFO] Searching for example 4+ star hotels...');
    const exampleHotels = await searchHotels({ minStars: 4, limit: 5 });
    
    console.log('\n[EXAMPLE] Sample 4+ star hotels:');
    exampleHotels.forEach((hotel, index) => {
      console.log(`[EXAMPLE] ${index + 1}. ${hotel.name} (${hotel.star_rating}★) - ${hotel.city}, ${hotel.country}`);
      console.log(`[EXAMPLE]    Address: ${hotel.address}`);
      console.log(`[EXAMPLE]    Amenities: ${hotel.amenities.slice(0, 5).join(', ')}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('[FATAL ERROR]', error);
    process.exit(1);
  }
}

// Run the analysis
main(); 