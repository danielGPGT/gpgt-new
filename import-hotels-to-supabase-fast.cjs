console.log('[DEBUG] Fast hotel import script started');
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
const PROGRESS_FILE = 'import-progress-fast.json';

console.log('[DEBUG] About to process file:', INPUT_FILE);

// Fast settings for maximum throughput
const BATCH_SIZE = 500; // Larger batches for speed
const MAX_CONCURRENT_BATCHES = 3;
const TIMEOUT_DELAY = 1000; // 1 second delay between batches

// Performance tracking
let totalProcessed = 0;
let totalBatches = 0;
let startTime = Date.now();
let lineCount = 0;
let lastProcessedLine = 0;
let failedHotels = [];
let filteredCount = 0;

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
      totalFiltered: filteredCount
    }));
  } catch (error) {
    console.error('[ERROR] Failed to save progress:', error.message);
  }
}

function mapHotel(d) {
  try {
    // Only process hotels with star ratings of 3 or higher
    if (!d.star_rating || d.star_rating === null || d.star_rating < 3) {
      filteredCount++;
      return null;
    }
    
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

async function insertBatchWithRetry(hotels, client, batchNum, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await client
        .from('hotels')
        .upsert(hotels, { 
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (error) {
        if (attempt === retries) {
          console.error(`[ERROR] Batch #${batchNum} failed after ${retries} attempts:`, error.message);
          return { success: 0, failed: hotels.length };
        }
        console.log(`[WARN] Batch #${batchNum} attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      return { success: hotels.length, failed: 0 };
    } catch (err) {
      if (attempt === retries) {
        console.error(`[ERROR] Batch #${batchNum} exception after ${retries} attempts:`, err.message);
        return { success: 0, failed: hotels.length };
      }
      console.log(`[WARN] Batch #${batchNum} attempt ${attempt} exception, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function processBatch(batch, batchNum) {
  if (batch.length === 0) return { success: 0, failed: 0 };
  
  console.log(`[INFO] Processing batch #${batchNum} (${batch.length} hotels)...`);
  const batchStartTime = Date.now();
  
  const client = clients[batchNum % clients.length];
  const result = await insertBatchWithRetry(batch, client, batchNum);
  
  const batchTime = Date.now() - batchStartTime;
  const rate = Math.round(result.success / (batchTime / 1000));
  console.log(`[SUCCESS] Batch #${batchNum}: ${result.success} success, ${result.failed} failed in ${batchTime}ms (${rate} hotels/sec)`);
  
  return result;
}

async function processBatchesConcurrently(batches) {
  const results = [];
  const batchPromises = batches.map((batch, index) => 
    processBatch(batch, totalBatches + index + 1)
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

async function processHotelDumpFast(filePath) {
  console.log('[INFO] Starting fast hotel import to Supabase...');
  console.log(`[CONFIG] Batch size: ${BATCH_SIZE}, Max concurrent: ${MAX_CONCURRENT_BATCHES}`);
  console.log(`[CONFIG] Only hotels with star ratings will be imported`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }
  
  lastProcessedLine = loadProgress();
  
  let batch = [];
  let pendingBatches = [];
  let processedCount = 0;
  let skippedLines = 0;
  
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  console.log('[INFO] Starting to process file line by line...');
  
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
      
      const mappedHotel = mapHotel(d);
      if (mappedHotel) {
        batch.push(mappedHotel);
        processedCount++;
      }
      
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
          console.log(`[PROGRESS] Processed ${totalProcessed} hotels, filtered ${filteredCount} in ${Math.round(elapsed/1000)}s (${rate} hotels/sec) - Line ${lineCount}`);
          
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      if (lineCount % 50000 === 0) {
        console.log(`[PROGRESS] Read ${lineCount} lines, processed ${processedCount} hotels, filtered ${filteredCount}, skipped ${skippedLines}...`);
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
  
  console.log('\n[SUMMARY] Fast hotel import completed!');
  console.log(`[SUMMARY] Total lines read: ${lineCount}`);
  console.log(`[SUMMARY] Lines skipped (already processed): ${skippedLines}`);
  console.log(`[SUMMARY] Hotels filtered out (no star rating): ${filteredCount}`);
  console.log(`[SUMMARY] Hotels imported: ${totalProcessed}`);
  console.log(`[SUMMARY] Total time: ${Math.round(totalTime/1000)}s`);
  console.log(`[SUMMARY] Average rate: ${avgRate} hotels/sec`);
  console.log(`[SUMMARY] Total batches: ${totalBatches}`);
  
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('[INFO] Progress file cleaned up');
  }
}

processHotelDumpFast(INPUT_FILE).catch(err => {
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