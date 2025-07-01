console.log('[DEBUG] Optimized hotel import script started');
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
const clients = Array.from({ length: 5 }, () => 
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  })
);

const INPUT_FILE = './hotel-data/hotel_dump_en.json';
const PROGRESS_FILE = 'import-progress.json';

console.log('[DEBUG] About to process file:', INPUT_FILE);

// Star rating filtering criteria
const FILTER_CRITERIA = {
  // Star rating: only 3-5 star hotels
  minStarRating: 3,
  
  // Test hotels to exclude
  excludedNames: ['test', 'Test', 'TEST', 'do not book', 'Do Not Book'],
  
  // Only these hotel types are allowed (everything else is excluded)
  allowedTypes: ['Hotel', 'Resort']
};

// Optimized settings to avoid timeouts
const BATCH_SIZE = 50; // Much smaller batches
const MAX_CONCURRENT_BATCHES = 5; // More concurrent batches
const CLIENT_ROUND_ROBIN = true;
const RETRY_ATTEMPTS = 3;
const TIMEOUT_DELAY = 1000; // 1 second delay between batches

// Performance tracking
let totalProcessed = 0;
let totalFiltered = 0;
let totalBatches = 0;
let startTime = Date.now();
let clientIndex = 0;
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

// Check if hotel meets all filtering criteria
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
    
    // Check hotel type - must be an actual hotel
    if (hotel.kind) {
      const hotelType = hotel.kind.toLowerCase();
      
      // Check if it's in allowed types (if specified)
      if (FILTER_CRITERIA.allowedTypes.length > 0) {
        const isAllowedType = FILTER_CRITERIA.allowedTypes.some(type => 
          hotelType.includes(type.toLowerCase())
        );
        if (!isAllowedType) {
          return false;
        }
      }
    } else {
      // If no kind specified, exclude it
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] Error checking filter criteria:', error.message);
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

async function insertHotelIndividually(hotel, client) {
  try {
    const { error } = await client
      .from('hotels')
      .upsert([hotel], { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`[ERROR] Failed to insert hotel ${hotel.id}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[ERROR] Exception inserting hotel ${hotel.id}:`, err.message);
    return false;
  }
}

async function processBatchWithIndividualInserts(batch, batchNum) {
  if (batch.length === 0) return { success: 0, failed: 0 };
  
  console.log(`[INFO] Processing batch #${batchNum} (${batch.length} hotels) with individual inserts...`);
  const batchStartTime = Date.now();
  
  let successCount = 0;
  let failedCount = 0;
  
  // Process hotels individually to avoid timeouts
  for (let i = 0; i < batch.length; i++) {
    const hotel = batch[i];
    const client = clients[i % clients.length];
    
    const success = await insertHotelIndividually(hotel, client);
    
    if (success) {
      successCount++;
    } else {
      failedCount++;
      failedHotels.push({ id: hotel.id, name: hotel.name, batch: batchNum });
    }
    
    // Small delay between individual inserts
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const batchTime = Date.now() - batchStartTime;
  const rate = Math.round(successCount / (batchTime / 1000));
  console.log(`[SUCCESS] Batch #${batchNum} completed: ${successCount} success, ${failedCount} failed in ${batchTime}ms (${rate} hotels/sec)`);
  
  return { success: successCount, failed: failedCount };
}

async function processBatchesConcurrently(batches) {
  const results = [];
  const batchPromises = batches.map((batch, index) => 
    processBatchWithIndividualInserts(batch, totalBatches + index + 1)
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

async function processHotelDumpOptimized(filePath) {
  console.log('[INFO] Starting optimized hotel import to Supabase with comprehensive filtering...');
  console.log(`[CONFIG] Min star rating: ${FILTER_CRITERIA.minStarRating}`);
  console.log(`[CONFIG] Allowed hotel types: ${FILTER_CRITERIA.allowedTypes.join(', ')}`);
  console.log(`[CONFIG] Batch size: ${BATCH_SIZE}, Max concurrent batches: ${MAX_CONCURRENT_BATCHES}, Clients: ${clients.length}`);
  console.log(`[CONFIG] Using individual inserts to avoid timeouts`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Load progress
  lastProcessedLine = loadProgress();
  
  let batch = [];
  let pendingBatches = [];
  let processedCount = 0;
  let skippedLines = 0;
  let filteredCount = 0;
  
  // Create readline interface for streaming
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  console.log('[INFO] Starting to process file line by line with comprehensive filtering...');
  
  for await (const line of rl) {
    lineCount++;
    
    // Skip lines we've already processed
    if (lineCount <= lastProcessedLine) {
      skippedLines++;
      continue;
    }
    
    if (!line.trim()) continue;
    
    try {
      const hotelObj = JSON.parse(line);
      const d = hotelObj.data || hotelObj;
      if (!d || !d.id) {
        console.log(`[WARN] Skipping line ${lineCount} - no valid hotel data`);
        continue;
      }
      
      // Apply comprehensive filtering (star rating + hotel type)
      if (meetsFilterCriteria(d)) {
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
        
        // Process batches concurrently when we have enough
        if (pendingBatches.length >= MAX_CONCURRENT_BATCHES) {
          const batchResults = await processBatchesConcurrently(pendingBatches);
          
          // Add delay between batch groups to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, TIMEOUT_DELAY));
          
          pendingBatches = [];
          
          // Save progress
          saveProgress(lineCount);
          
          // Progress update
          const elapsed = Date.now() - startTime;
          const rate = Math.round(totalProcessed / (elapsed / 1000));
          console.log(`[PROGRESS] Processed ${totalProcessed} hotels, filtered ${filteredCount} in ${Math.round(elapsed/1000)}s (${rate} hotels/sec) - Line ${lineCount}`);
          
          // Memory cleanup
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      // Progress indicator every 1,000 lines
      if (lineCount % 1000 === 0) {
        console.log(`[PROGRESS] Read ${lineCount} lines, processed ${processedCount} hotels, filtered ${filteredCount}, skipped ${skippedLines} lines...`);
      }
      
    } catch (err) {
      console.error(`[ERROR] Failed to process line ${lineCount}:`, err.message);
    }
  }
  
  // Process remaining hotels
  if (batch.length > 0) {
    pendingBatches.push(batch);
  }
  
  // Process any remaining batches
  if (pendingBatches.length > 0) {
    const batchResults = await processBatchesConcurrently(pendingBatches);
  }
  
  // Final summary
  const totalTime = Date.now() - startTime;
  const avgRate = Math.round(totalProcessed / (totalTime / 1000));
  
  console.log('\n[SUMMARY] Import completed!');
  console.log(`[SUMMARY] Total lines read: ${lineCount}`);
  console.log(`[SUMMARY] Lines skipped (already processed): ${skippedLines}`);
  console.log(`[SUMMARY] Hotels filtered out: ${filteredCount}`);
  console.log(`[SUMMARY] Total processed: ${totalProcessed}`);
  console.log(`[SUMMARY] Failed hotels: ${failedHotels.length}`);
  console.log(`[SUMMARY] Total time: ${Math.round(totalTime/1000)}s`);
  console.log(`[SUMMARY] Average rate: ${avgRate} hotels/sec`);
  console.log(`[SUMMARY] Total batches: ${totalBatches}`);
  
  // Save failed hotels for retry
  if (failedHotels.length > 0) {
    fs.writeFileSync('failed-hotels.json', JSON.stringify(failedHotels, null, 2));
    console.log(`[INFO] Failed hotels saved to failed-hotels.json for retry`);
  }
  
  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('[INFO] Progress file cleaned up');
  }
}

// Error handling for the main process
processHotelDumpOptimized(INPUT_FILE).catch(err => {
  console.error('[FATAL ERROR]', err);
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[INFO] Import interrupted by user');
  console.log('[INFO] Progress saved, you can resume later');
  process.exit(0);
});

// Handle uncaught exceptions
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