console.log('[INFO] Estimating filtered hotel count...');
const fs = require('fs');
const readline = require('readline');

const HOTEL_FILE = './hotel-data/hotel_dump_en.json';
const SAMPLE_SIZE = 100000; // Analyze first 100k hotels for estimation

// Filter criteria
const FILTER_CRITERIA = {
  minStarRating: 3,
  allowedTypes: ['Hotel', 'Resort'],
  excludedNames: ['test', 'Test', 'TEST', 'do not book', 'Do Not Book']
};

function meetsFilterCriteria(hotel) {
  try {
    // Skip test hotels
    if (FILTER_CRITERIA.excludedNames.some(name => 
      hotel.name && hotel.name.toLowerCase().includes(name.toLowerCase())
    )) {
      return false;
    }
    
    // MUST have a star rating (not null) and meet minimum requirement
    if (!hotel.star_rating || hotel.star_rating === null || hotel.star_rating < FILTER_CRITERIA.minStarRating) {
      return false;
    }
    
    // Check hotel type - must be Hotel or Resort
    if (hotel.kind) {
      const hotelType = hotel.kind.toLowerCase();
      const isAllowedType = FILTER_CRITERIA.allowedTypes.some(type => 
        hotelType.includes(type.toLowerCase())
      );
      if (!isAllowedType) {
        return false;
      }
    } else {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function estimateFilteredCount() {
  if (!fs.existsSync(HOTEL_FILE)) {
    console.error(`[ERROR] Hotel file not found: ${HOTEL_FILE}`);
    process.exit(1);
  }

  const readStream = fs.createReadStream(HOTEL_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let validHotels = 0;
  let filteredHotels = 0;
  let starRatings = {};
  let hotelTypes = {};
  let countries = {};

  console.log(`[INFO] Analyzing first ${SAMPLE_SIZE.toLocaleString()} hotels for estimation...`);

  for await (const line of rl) {
    if (lineCount >= SAMPLE_SIZE) break;
    
    lineCount++;
    
    if (!line.trim()) continue;
    
    try {
      const hotel = JSON.parse(line);
      validHotels++;
      
      // Count star ratings
      const stars = hotel.star_rating || 0;
      starRatings[stars] = (starRatings[stars] || 0) + 1;
      
      // Count hotel types
      const type = hotel.kind || 'Unknown';
      hotelTypes[type] = (hotelTypes[type] || 0) + 1;
      
      // Count countries
      if (hotel.region && hotel.region.country_code) {
        const country = hotel.region.country_code;
        countries[country] = (countries[country] || 0) + 1;
      }
      
      // Check if meets our filter criteria
      if (meetsFilterCriteria(hotel)) {
        filteredHotels++;
      }
      
      // Progress indicator
      if (lineCount % 10000 === 0) {
        console.log(`[PROGRESS] Analyzed ${lineCount.toLocaleString()} lines, found ${filteredHotels} matching hotels...`);
      }
      
    } catch (error) {
      // Skip invalid lines
    }
  }

  // Calculate estimates
  const filterRate = filteredHotels / validHotels;
  const estimatedTotal = Math.round(filterRate * 1000000); // Assuming ~1M total hotels

  console.log('\n[ESTIMATE] Analysis completed!');
  console.log(`[ESTIMATE] Sample size: ${lineCount.toLocaleString()} lines`);
  console.log(`[ESTIMATE] Valid hotels in sample: ${validHotels.toLocaleString()}`);
  console.log(`[ESTIMATE] Hotels matching criteria: ${filteredHotels.toLocaleString()}`);
  console.log(`[ESTIMATE] Filter rate: ${(filterRate * 100).toFixed(2)}%`);
  
  console.log(`\n[ESTIMATE] Estimated total hotels meeting criteria:`);
  console.log(`[ESTIMATE] - Conservative (500k total): ${Math.round(filterRate * 500000).toLocaleString()}`);
  console.log(`[ESTIMATE] - Moderate (1M total): ${Math.round(filterRate * 1000000).toLocaleString()}`);
  console.log(`[ESTIMATE] - Liberal (2M total): ${Math.round(filterRate * 2000000).toLocaleString()}`);

  console.log(`\n[ESTIMATE] Star rating distribution in sample:`);
  Object.entries(starRatings)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([stars, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[ESTIMATE]   ${stars} stars: ${count.toLocaleString()} (${percentage}%)`);
    });

  console.log(`\n[ESTIMATE] Hotel types in sample:`);
  Object.entries(hotelTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([type, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[ESTIMATE]   ${type}: ${count.toLocaleString()} (${percentage}%)`);
    });

  console.log(`\n[ESTIMATE] Top countries in sample:`);
  Object.entries(countries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([country, count]) => {
      const percentage = ((count / validHotels) * 100).toFixed(1);
      console.log(`[ESTIMATE]   ${country}: ${count.toLocaleString()} (${percentage}%)`);
    });

  return {
    sampleSize: lineCount,
    validHotels,
    filteredHotels,
    filterRate,
    estimatedTotal
  };
}

// Run the estimation
estimateFilteredCount().catch(console.error); 