console.log('[INFO] Quick hotel data preview started...');
const fs = require('fs');
const readline = require('readline');

const HOTEL_FILE = './hotel-data/hotel_dump_en.json';
const PREVIEW_LIMIT = 10000; // Only analyze first 10,000 hotels

// Check if file exists
if (!fs.existsSync(HOTEL_FILE)) {
  console.error(`[ERROR] Hotel file not found: ${HOTEL_FILE}`);
  process.exit(1);
}

console.log(`[INFO] Quick preview of first ${PREVIEW_LIMIT} hotels from: ${HOTEL_FILE}`);

async function quickPreview() {
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

  console.log('[INFO] Analyzing first 10,000 hotels...');

  for await (const line of rl) {
    if (validHotels >= PREVIEW_LIMIT) break;
    
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
      
      // Save sample hotels (first 10 with different star ratings)
      if (sampleHotels.length < 10) {
        sampleHotels.push({
          id: hotel.id,
          name: hotel.name,
          star_rating: hotel.star_rating,
          country: hotel.region?.country_code,
          city: hotel.region?.name,
          type: hotel.kind,
          amenities_count: hotel.amenity_groups?.length || 0,
          images_count: hotel.images?.length || 0,
          address: hotel.address?.substring(0, 100) + '...'
        });
      }
      
      // Progress indicator
      if (validHotels % 1000 === 0) {
        console.log(`[PROGRESS] Analyzed ${validHotels} hotels...`);
      }
      
    } catch (error) {
      // Skip invalid lines
    }
  }

  console.log('\n[PREVIEW] Quick analysis completed!');
  console.log(`[PREVIEW] Lines processed: ${lineCount}`);
  console.log(`[PREVIEW] Valid hotels found: ${validHotels}`);
  
  console.log(`\n[PREVIEW] Star rating distribution:`);
  Object.entries(starRatings)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([stars, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[PREVIEW]   ${stars} stars: ${count} hotels (${percentage}%)`);
    });
  
  console.log(`\n[PREVIEW] Top 10 countries:`);
  Object.entries(countries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([country, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[PREVIEW]   ${country}: ${count} hotels (${percentage}%)`);
    });
  
  console.log(`\n[PREVIEW] Hotel types:`);
  Object.entries(hotelTypes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[PREVIEW]   ${type}: ${count} hotels (${percentage}%)`);
    });

  console.log(`\n[PREVIEW] Sample hotels:`);
  sampleHotels.forEach((hotel, index) => {
    console.log(`[PREVIEW] ${index + 1}. ${hotel.name} (${hotel.star_rating}★) - ${hotel.city}, ${hotel.country}`);
    console.log(`[PREVIEW]    Type: ${hotel.type}`);
    console.log(`[PREVIEW]    Address: ${hotel.address}`);
    console.log(`[PREVIEW]    Amenities: ${hotel.amenities_count}, Images: ${hotel.images_count}`);
    console.log('');
  });

  // Save preview data
  const previewData = {
    total_analyzed: validHotels,
    star_ratings: starRatings,
    countries: countries,
    hotel_types: hotelTypes,
    sample_hotels: sampleHotels,
    analysis_date: new Date().toISOString()
  };

  fs.writeFileSync('./hotel-data/hotel_preview.json', JSON.stringify(previewData, null, 2));
  console.log(`[PREVIEW] Preview data saved to: ./hotel-data/hotel_preview.json`);
}

// Run the preview
quickPreview().catch(console.error); 