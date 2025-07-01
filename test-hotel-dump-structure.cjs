const { spawn } = require('child_process');
const path = require('path');

// Path to the compressed hotel dump
const hotelDataPath = path.join(__dirname, 'data', 'hotels_dump.json.zst');

console.log('🔍 Extracting 10 hotels from dump file to analyze structure...');
console.log('📁 File path:', hotelDataPath);

let hotelCount = 0;
const hotels = [];

// Use zstd to decompress and read the first 10 hotels
const zstd = spawn('zstd', ['-d', '-c', hotelDataPath]);
const readline = require('readline');
const rl = readline.createInterface({ input: zstd.stdout, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.trim() && hotelCount < 10) {
    try {
      const hotel = JSON.parse(line);
      hotels.push(hotel);
      hotelCount++;
      
      console.log(`\n🏨 Hotel ${hotelCount}:`);
      console.log('  ID:', hotel.id);
      console.log('  Name:', hotel.name);
      console.log('  Star Rating:', hotel.star_rating);
      console.log('  Region:', hotel.region?.name);
      console.log('  Country:', hotel.region?.country_code);
      console.log('  Address:', hotel.address);
      console.log('  Has Images:', hotel.images ? hotel.images.length : 0);
      console.log('  Has Description:', !!hotel.description);
      console.log('  Amenities:', hotel.serp_filters?.slice(0, 5) || []);
      
      if (hotelCount >= 10) {
        zstd.kill();
        rl.close();
      }
    } catch (e) {
      console.log('❌ Error parsing hotel:', e.message);
    }
  }
});

rl.on('close', () => {
  console.log('\n📊 Summary:');
  console.log(`✅ Extracted ${hotels.length} hotels`);
  
  console.log('\n🔍 Sample hotel IDs:');
  hotels.forEach((hotel, index) => {
    console.log(`  ${index + 1}. ${hotel.id} - ${hotel.name}`);
  });
  
  console.log('\n🎯 Now let\'s look for some specific hotels that match our RateHawk IDs:');
  const ratehawkIds = [
    'pullman_paris_bercy',
    'novotel_paris_bercy', 
    'ibis_paris_montmartre_18eme',
    'mercure_paris_montmartre_sacre_coeur'
  ];
  
  console.log('\n🔍 Searching for RateHawk hotel matches...');
  
  // Search again for specific hotels
  const zstd2 = spawn('zstd', ['-d', '-c', hotelDataPath]);
  const rl2 = readline.createInterface({ input: zstd2.stdout, crlfDelay: Infinity });
  
  let foundMatches = 0;
  
  rl2.on('line', (line) => {
    if (line.trim() && foundMatches < ratehawkIds.length) {
      try {
        const hotel = JSON.parse(line);
        const hotelNameLower = hotel.name?.toLowerCase() || '';
        
        // Check if this hotel matches any of our RateHawk IDs
        for (const ratehawkId of ratehawkIds) {
          const searchName = ratehawkId.replace(/_/g, ' ').toLowerCase();
          
          if (hotelNameLower.includes(searchName) || searchName.includes(hotelNameLower)) {
            console.log(`\n✅ MATCH FOUND!`);
            console.log(`  RateHawk ID: ${ratehawkId}`);
            console.log(`  Dump Hotel: ${hotel.id} - ${hotel.name}`);
            console.log(`  Star Rating: ${hotel.star_rating}`);
            console.log(`  Images: ${hotel.images?.length || 0}`);
            foundMatches++;
            break;
          }
        }
        
        if (foundMatches >= ratehawkIds.length) {
          zstd2.kill();
          rl2.close();
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  });
  
  rl2.on('close', () => {
    console.log('\n🎉 Analysis complete!');
    process.exit(0);
  });
  
  rl2.on('error', (err) => {
    console.error('❌ Error reading hotel data:', err);
    process.exit(1);
  });
  
  zstd2.on('error', (err) => {
    console.error('❌ Error with zstd decompression:', err);
    process.exit(1);
  });
});

rl.on('error', (err) => {
  console.error('❌ Error reading hotel data:', err);
  process.exit(1);
});

zstd.on('error', (err) => {
  console.error('❌ Error with zstd decompression:', err);
  process.exit(1);
}); 