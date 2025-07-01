console.log('[DEBUG] Filtered luxury hotel import script started');
require('dotenv').config({ path: 'server.env' });
const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Missing Supabase credentials in server.env');
  process.exit(1);
}

// Create multiple clients for parallel processing
const clients = Array.from({ length: 3 }, () => 
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  })
);

const INPUT_FILE = './hotel-data/hotel_dump_en.json';
const PROGRESS_FILE = 'import-progress-filtered.json';

console.log('[DEBUG] About to process file:', INPUT_FILE);

// Filtering criteria for luxury hotels
const FILTER_CRITERIA = {
  // Star rating: only 3-5 star hotels
  minStarRating: 3,
  
  // Hotel types to include (exclude apartments, hostels, etc.)
  allowedTypes: ['Hotel', 'Resort', 'Luxury Hotel', 'Boutique Hotel'],
  
  // Hotel types to exclude
  excludedTypes: ['Apartment', 'Hostel', 'Guesthouse', 'Motel', 'Capsule Hotel'],
  
  // Test hotels to exclude
  excludedNames: ['test', 'Test', 'TEST', 'do not book', 'Do Not Book'],
  
  // Luxury amenities that indicate high-end hotels
  luxuryAmenities: [
    'spa', 'Spa', 'SPA',
    'swimming pool', 'Swimming Pool', 'Pool', 'pool',
    'concierge', 'Concierge',
    'room service', 'Room Service',
    'fitness center', 'Fitness Center', 'gym', 'Gym',
    'restaurant', 'Restaurant',
    'bar', 'Bar',
    'valet parking', 'Valet Parking',
    'butler service', 'Butler Service',
    'private beach', 'Private Beach',
    'golf course', 'Golf Course',
    'tennis court', 'Tennis Court'
  ],
  
  // Premium hotel chains
  premiumChains: [
    'Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Ritz-Carlton',
    'Four Seasons', 'Mandarin Oriental', 'Park Hyatt', 'St. Regis',
    'W Hotels', 'Conrad', 'Waldorf Astoria', 'Raffles', 'Aman',
    'Bulgari', 'Aman Resorts', 'Six Senses', 'Rosewood', 'Auberge'
  ],
  
  // Countries to focus on (popular luxury destinations)
  targetCountries: [
    'US', 'CA', 'GB', 'FR', 'IT', 'ES', 'DE', 'CH', 'AT', 'NL',
    'JP', 'SG', 'AU', 'NZ', 'AE', 'TH', 'MY', 'ID', 'PH', 'VN',
    'BR', 'MX', 'AR', 'CL', 'PE', 'CO', 'ZA', 'EG', 'MA', 'KE'
  ]
};

// Optimized settings
const BATCH_SIZE = 25;
const MAX_CONCURRENT_BATCHES = 2;
const RETRY_ATTEMPTS = 3;
const TIMEOUT_DELAY = 2000;

// Performance tracking
let totalProcessed = 0;
let totalFiltered = 0;
let totalBatches = 0;
let startTime = Date.now();
let lineCount = 0;
let lastProcessedLine = 0;
let failedHotels = [];

// Load progress if exists
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`[INFO] Resuming from line ${progress.lastProcessedLine}`);
      return progress.lastProcessedLine;
    }
  } catch (error) {
    console.log('[INFO] No progress file found, starting fresh');
  }
  return 0;
}

// Save progress
function saveProgress(lineNumber) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
      lastProcessedLine: lineNumber,
      timestamp: new Date().toISOString(),
      totalProcessed: totalProcessed,
      totalFiltered: totalFiltered
    }));
  } catch (error) {
    console.error('[ERROR] Failed to save progress:', error.message);
  }
}

// Check if hotel meets luxury criteria
function isLuxuryHotel(hotel) {
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
    
    // Check hotel type
    if (hotel.kind) {
      const hotelType = hotel.kind.toLowerCase();
      if (FILTER_CRITERIA.excludedTypes.some(type => 
        hotelType.includes(type.toLowerCase())
      )) {
        return false;
      }
    }
    
    // Check if it's a premium chain (automatic inclusion if it has star rating)
    if (hotel.hotel_chain && FILTER_CRITERIA.premiumChains.some(chain => 
      hotel.hotel_chain.toLowerCase().includes(chain.toLowerCase())
    )) {
      return true; // Premium chain with star rating = automatic inclusion
    }
    
    // Check for luxury amenities
    if (hotel.amenity_groups) {
      const allAmenities = hotel.amenity_groups.flatMap(group => 
        group.amenities || []
      ).map(amenity => amenity.toLowerCase());
      
      const hasLuxuryAmenities = FILTER_CRITERIA.luxuryAmenities.some(amenity => 
        allAmenities.some(hotelAmenity => 
          hotelAmenity.includes(amenity.toLowerCase())
        )
      );
      
      if (hasLuxuryAmenities) {
        return true;
      }
    }
    
    // Check target countries (only if it has star rating)
    if (hotel.region && hotel.region.country_code) {
      if (FILTER_CRITERIA.targetCountries.includes(hotel.region.country_code)) {
        // If it's in a target country and has good star rating, include it
        if (hotel.star_rating && hotel.star_rating >= 3) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('[ERROR] Error checking luxury criteria:', error.message);
    return false;
  }
}

function mapHotel(d) {
  try {
    return {
      id: d.id,
      hid: d.hid || null,
      name: d.name || 'Unknown Hotel',
      address: d.address || null,
      city: d.region?.name || null,
      country: d.region?.country_code || null,
      region_id: d.region?.id || null,
      latitude: d.latitude || null,
      longitude: d.longitude || null,
      amenities: d.amenity_groups?.flatMap(g => g.amenities || []) || [],
      star_rating: d.star_rating || null,
      hotel_chain: d.hotel_chain || null,
      kind: d.kind || null,
      images: d.images || [],
      room_groups: d.room_groups || [],
      is_closed: d.is_closed || false,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('[ERROR] Failed to map hotel:', error.message);
    return null;
  }
}

async function insertHotelBulk(hotels, client) {
  try {
    const { error } = await client
      .from('hotels')
      .upsert(hotels, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`[ERROR] Failed to insert batch:`, error.message);
      return { success: 0, failed: hotels.length };
    }
    return { success: hotels.length, failed: 0 };
  } catch (err) {
    console.error(`[ERROR] Exception inserting batch:`, err.message);
    return { success: 0, failed: hotels.length };
  }
}

async function processBatchWithBulkInserts(batch, batchNum) {
  if (batch.length === 0) return { success: 0, failed: 0 };
  
  console.log(`[INFO] Processing luxury batch #${batchNum} (${batch.length} hotels) with bulk insert...`);
  const batchStartTime = Date.now();
  
  // Use bulk insert instead of individual inserts
  const client = clients[batchNum % clients.length];
  const result = await insertHotelBulk(batch, client);
  
  const batchTime = Date.now() - batchStartTime;
  const rate = Math.round(result.success / (batchTime / 1000));
  console.log(`[SUCCESS] Luxury batch #${batchNum}: ${result.success} success, ${result.failed} failed in ${batchTime}ms (${rate} hotels/sec)`);
  
  return result;
}

async function processBatchesConcurrently(batches) {
  const results = [];
  const batchPromises = batches.map((batch, index) => 
    processBatchWithBulkInserts(batch, totalBatches + index + 1)
  );
  
  const batchResults = await Promise.allSettled(batchPromises);
  
  batchResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { success, failed } = result.value;
      results.push({ success, failed });
      totalProcessed += success;
    } else {
      console.error(`[ERROR] Batch ${totalBatches + index + 1} failed:`, result.reason);
      results.push({ success: 0, failed: batches[index].length });
    }
  });
  
  totalBatches += batches.length;
  return results;
}

async function processHotelDumpFiltered(filePath) {
  console.log('[INFO] Starting filtered luxury hotel import to Supabase...');
  console.log(`[CONFIG] Filter criteria:`);
  console.log(`[CONFIG] - Min star rating: ${FILTER_CRITERIA.minStarRating}`);
  console.log(`[CONFIG] - Target countries: ${FILTER_CRITERIA.targetCountries.length} countries`);
  console.log(`[CONFIG] - Premium chains: ${FILTER_CRITERIA.premiumChains.length} chains`);
  console.log(`[CONFIG] - Luxury amenities: ${FILTER_CRITERIA.luxuryAmenities.length} amenities`);
  console.log(`[CONFIG] - Batch size: ${BATCH_SIZE}, Max concurrent: ${MAX_CONCURRENT_BATCHES}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }
  
  lastProcessedLine = loadProgress();
  
  let batch = [];
  let pendingBatches = [];
  let processedCount = 0;
  let skippedLines = 0;
  let filteredCount = 0;
  
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  console.log('[INFO] Starting to process file line by line with luxury filtering...');
  
  for await (const line of rl) {
    lineCount++;
    
    if (lineCount <= lastProcessedLine) {
      skippedLines++;
      continue;
    }
    
    if (!line.trim()) continue;
    
    try {
      const hotelObj = JSON.parse(line);
      const d = hotelObj.data || hotelObj;
      if (!d || !d.id) {
        continue;
      }
      
      // Apply luxury filtering
      if (isLuxuryHotel(d)) {
        const mappedHotel = mapHotel(d);
        if (mappedHotel) {
          batch.push(mappedHotel);
          processedCount++;
        }
      } else {
        filteredCount++;
      }
      
      // Process batch when it reaches the target size
      if (batch.length >= BATCH_SIZE) {
        pendingBatches.push([...batch]);
        batch = [];
        
        if (pendingBatches.length >= MAX_CONCURRENT_BATCHES) {
          const batchResults = await processBatchesConcurrently(pendingBatches);
          
          await new Promise(resolve => setTimeout(resolve, TIMEOUT_DELAY));
          
          pendingBatches = [];
          saveProgress(lineCount);
          
          const elapsed = Date.now() - startTime;
          const rate = Math.round(totalProcessed / (elapsed / 1000));
          console.log(`[PROGRESS] Processed ${totalProcessed} luxury hotels, filtered ${filteredCount} in ${Math.round(elapsed/1000)}s (${rate} hotels/sec) - Line ${lineCount}`);
          
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      if (lineCount % 10000 === 0) {
        console.log(`[PROGRESS] Read ${lineCount} lines, processed ${processedCount} luxury hotels, filtered ${filteredCount}, skipped ${skippedLines}...`);
      }
      
    } catch (err) {
      console.error(`[ERROR] Failed to process line ${lineCount}:`, err.message);
    }
  }
  
  if (batch.length > 0) {
    pendingBatches.push(batch);
  }
  
  if (pendingBatches.length > 0) {
    const batchResults = await processBatchesConcurrently(pendingBatches);
  }
  
  const totalTime = Date.now() - startTime;
  const avgRate = Math.round(totalProcessed / (totalTime / 1000));
  
  console.log('\n[SUMMARY] Filtered luxury hotel import completed!');
  console.log(`[SUMMARY] Total lines read: ${lineCount}`);
  console.log(`[SUMMARY] Lines skipped (already processed): ${skippedLines}`);
  console.log(`[SUMMARY] Hotels filtered out: ${filteredCount}`);
  console.log(`[SUMMARY] Luxury hotels imported: ${totalProcessed}`);
  console.log(`[SUMMARY] Failed hotels: ${failedHotels.length}`);
  console.log(`[SUMMARY] Total time: ${Math.round(totalTime/1000)}s`);
  console.log(`[SUMMARY] Average rate: ${avgRate} hotels/sec`);
  console.log(`[SUMMARY] Total batches: ${totalBatches}`);
  
  if (failedHotels.length > 0) {
    fs.writeFileSync('failed-luxury-hotels.json', JSON.stringify(failedHotels, null, 2));
    console.log(`[INFO] Failed hotels saved to failed-luxury-hotels.json`);
  }
  
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('[INFO] Progress file cleaned up');
  }
}

processHotelDumpFiltered(INPUT_FILE).catch(err => {
  console.error('[FATAL ERROR]', err);
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[INFO] Import interrupted by user');
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL ERROR] Uncaught exception:', err);
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL ERROR] Unhandled rejection at:', promise, 'reason:', reason);
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(1);
}); 