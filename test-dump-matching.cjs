const { spawn } = require('child_process');
const path = require('path');

// Path to the fresh hotel dump
const hotelDataPath = path.join(__dirname, 'data', 'fresh_hotels_dump.json.zst');

// RateHawk hotel IDs from the search results
const ratehawkHotelIds = [
  'pullman_paris_bercy',
  'pullman_paris_la_defense',
  'hotel_de_france_gare_de_lyon_bastille',
  'hotel_bellevue_paris_montmartre',
  'novotel_paris_bercy',
  'hotel_reseda',
  'mercure_paris_montmartre_sacre_coeur',
  'ibis_paris_montmartre_18eme',
  'hotel_peyris_opera',
  'hotel_prince_albert_concordia',
  'libertel_gare_du_nord_suede_2',
  'best_western_alize_paris_montmartre',
  'hotel_magenta_paris',
  'timhotel_opera_blanche_fontaine_3'
];

console.log('🔍 Testing RateHawk hotel ID matching with fresh dump...');
console.log('📁 Dump file:', hotelDataPath);
console.log('🎯 Looking for RateHawk hotel IDs:', ratehawkHotelIds);

let hotelCount = 0;
let matches = [];
let sampleHotels = [];

// Use zstd to decompress and search for matches
const zstd = spawn('zstd', ['-d', '-c', hotelDataPath]);
const readline = require('readline');
const rl = readline.createInterface({ input: zstd.stdout, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.trim()) {
    try {
      const hotel = JSON.parse(line);
      hotelCount++;
      
      // Check if this hotel ID matches any RateHawk IDs
      if (ratehawkHotelIds.includes(hotel.id)) {
        matches.push(hotel);
        console.log(`✅ MATCH FOUND!`);
        console.log(`  RateHawk ID: ${hotel.id}`);
        console.log(`  Hotel Name: ${hotel.name}`);
        console.log(`  Star Rating: ${hotel.star_rating}`);
        console.log(`  Region: ${hotel.region?.name}`);
        console.log(`  Country: ${hotel.region?.country_code}`);
        console.log('---');
      }
      
      // Collect some sample hotels for analysis
      if (sampleHotels.length < 10) {
        sampleHotels.push({
          id: hotel.id,
          name: hotel.name,
          star_rating: hotel.star_rating,
          region: hotel.region?.name,
          country: hotel.region?.country_code
        });
      }
      
      // Log progress every 10,000 hotels
      if (hotelCount % 10000 === 0) {
        console.log(`📊 Processed ${hotelCount} hotels, found ${matches.length} matches`);
      }
      
      // Stop if we've found all matches or processed too many
      if (matches.length >= ratehawkHotelIds.length || hotelCount > 100000) {
        zstd.kill();
        rl.close();
      }
      
    } catch (e) {
      // Skip malformed lines
    }
  }
});

rl.on('close', () => {
  console.log(`\n🎉 Analysis complete!`);
  console.log(`📊 Total hotels processed: ${hotelCount}`);
  console.log(`✅ Matches found: ${matches.length}/${ratehawkHotelIds.length}`);
  
  if (matches.length > 0) {
    console.log(`\n🏨 Matched hotels:`);
    matches.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.id} - ${hotel.name}`);
    });
  } else {
    console.log(`\n❌ No exact matches found.`);
    
    console.log(`\n🔍 Sample hotel IDs from dump:`);
    sampleHotels.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.id} - ${hotel.name}`);
    });
    
    console.log(`\n💡 The RateHawk hotel IDs might use a different format than the dump.`);
    console.log(`   We may need to implement fuzzy matching or ID transformation.`);
  }
  
  process.exit(0);
});

rl.on('error', (err) => {
  console.error('❌ Error reading hotel data:', err);
  process.exit(1);
});

zstd.on('error', (err) => {
  console.error('❌ Error with zstd decompression:', err);
  process.exit(1);
}); 