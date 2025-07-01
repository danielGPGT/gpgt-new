require('dotenv').config({ path: 'server.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Missing Supabase credentials in server.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseStatus() {
  console.log('[INFO] Checking database status...\n');
  
  try {
    // Check total hotel count
    const { count: totalHotels, error: countError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[ERROR] Failed to get hotel count:', countError);
      return;
    }
    
    console.log(`[DATABASE] Total hotels in database: ${totalHotels?.toLocaleString() || 0}`);
    
    // Check hotels with HIDs
    const { count: hotelsWithHid, error: hidError } = await supabase
      .from('hotels')
      .select('hid', { count: 'exact', head: true })
      .not('hid', 'is', null);
    
    if (hidError) {
      console.error('[ERROR] Failed to get HID count:', hidError);
    } else {
      console.log(`[DATABASE] Hotels with HID: ${hotelsWithHid?.toLocaleString() || 0}`);
    }
    
    // Check hotels with room groups
    const { count: hotelsWithRooms, error: roomsError } = await supabase
      .from('hotels')
      .select('room_groups', { count: 'exact', head: true })
      .not('room_groups', 'eq', '[]');
    
    if (roomsError) {
      console.error('[ERROR] Failed to get room groups count:', roomsError);
    } else {
      console.log(`[DATABASE] Hotels with room groups: ${hotelsWithRooms?.toLocaleString() || 0}`);
    }
    
    // Check recent imports (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentImports, error: recentError } = await supabase
      .from('hotels')
      .select('updated_at', { count: 'exact', head: true })
      .gte('updated_at', oneHourAgo);
    
    if (recentError) {
      console.error('[ERROR] Failed to get recent imports count:', recentError);
    } else {
      console.log(`[DATABASE] Hotels imported in last hour: ${recentImports?.toLocaleString() || 0}`);
    }
    
    // Sample some recent hotels
    const { data: recentHotels, error: sampleError } = await supabase
      .from('hotels')
      .select('id, name, hid, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (sampleError) {
      console.error('[ERROR] Failed to get recent hotels sample:', sampleError);
    } else if (recentHotels && recentHotels.length > 0) {
      console.log('\n[RECENT] Most recently imported hotels:');
      recentHotels.forEach(hotel => {
        console.log(`  - ${hotel.name} (ID: ${hotel.id}, HID: ${hotel.hid || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('[ERROR] Database check failed:', error);
  }
}

async function checkImportProgress() {
  console.log('\n[INFO] Checking import progress...\n');
  
  const progressFile = 'import-progress.json';
  
  if (fs.existsSync(progressFile)) {
    try {
      const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      console.log(`[PROGRESS] Last processed line: ${progress.lastProcessedLine?.toLocaleString() || 0}`);
      console.log(`[PROGRESS] Last update: ${progress.timestamp}`);
      
      // Calculate progress percentage (assuming ~3M hotels)
      const estimatedTotalLines = 3000000;
      const progressPercent = Math.round((progress.lastProcessedLine / estimatedTotalLines) * 100);
      console.log(`[PROGRESS] Estimated completion: ${progressPercent}%`);
      
    } catch (error) {
      console.error('[ERROR] Failed to read progress file:', error.message);
    }
  } else {
    console.log('[PROGRESS] No progress file found - import may not be running');
  }
}

async function checkFileStatus() {
  console.log('\n[INFO] Checking input file status...\n');
  
  const inputFile = 'hotel_dump_en.json';
  
  if (fs.existsSync(inputFile)) {
    const stats = fs.statSync(inputFile);
    const fileSizeMB = Math.round(stats.size / (1024 * 1024));
    console.log(`[FILE] File size: ${fileSizeMB.toLocaleString()} MB`);
    console.log(`[FILE] Last modified: ${stats.mtime}`);
    
    // Count lines in file (sample)
    try {
      const readline = require('readline');
      const fileStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
      
      let lineCount = 0;
      const maxLinesToCount = 10000; // Sample first 10k lines
      
      for await (const line of rl) {
        lineCount++;
        if (lineCount >= maxLinesToCount) break;
      }
      
      console.log(`[FILE] Sample line count (first ${maxLinesToCount.toLocaleString()}): ${lineCount.toLocaleString()}`);
      
      // Estimate total lines based on file size
      const estimatedTotalLines = Math.round((stats.size / 1024) * (lineCount / maxLinesToCount));
      console.log(`[FILE] Estimated total lines: ${estimatedTotalLines.toLocaleString()}`);
      
    } catch (error) {
      console.error('[ERROR] Failed to count lines:', error.message);
    }
  } else {
    console.log('[FILE] Input file not found');
  }
}

async function checkSystemResources() {
  console.log('\n[INFO] Checking system resources...\n');
  
  const os = require('os');
  
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));
  const usedMem = totalMem - freeMem;
  const memUsage = Math.round((usedMem / totalMem) * 100);
  
  console.log(`[SYSTEM] Memory: ${usedMem}GB / ${totalMem}GB (${memUsage}% used)`);
  console.log(`[SYSTEM] CPU cores: ${os.cpus().length}`);
  console.log(`[SYSTEM] Platform: ${os.platform()}`);
  console.log(`[SYSTEM] Node version: ${process.version}`);
  
  // Check if we're running with garbage collection
  if (global.gc) {
    console.log('[SYSTEM] Garbage collection enabled');
  } else {
    console.log('[SYSTEM] Garbage collection not enabled (run with --expose-gc)');
  }
}

async function checkSupabaseLimits() {
  console.log('\n[INFO] Checking potential Supabase limits...\n');
  
  try {
    // Check for any recent errors in logs
    console.log('[LIMITS] Checking for potential issues:');
    console.log('[LIMITS] - Row limits: Supabase free tier has 50k row limit');
    console.log('[LIMITS] - Storage limits: Check your Supabase dashboard');
    console.log('[LIMITS] - Rate limits: Check for 429 errors in logs');
    console.log('[LIMITS] - Connection limits: Multiple concurrent connections');
    
    // Test a simple query to check connectivity
    const { data, error } = await supabase
      .from('hotels')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[LIMITS] Database connectivity issue:', error);
    } else {
      console.log('[LIMITS] Database connectivity: OK');
    }
    
  } catch (error) {
    console.error('[ERROR] Failed to check limits:', error);
  }
}

async function main() {
  console.log('=== HOTEL IMPORT MONITOR ===\n');
  
  await checkDatabaseStatus();
  await checkImportProgress();
  await checkFileStatus();
  await checkSystemResources();
  await checkSupabaseLimits();
  
  console.log('\n=== MONITORING COMPLETE ===');
  console.log('\n[RECOMMENDATIONS]');
  console.log('- If import stopped early, check the progress file and resume');
  console.log('- Monitor memory usage and consider smaller batch sizes');
  console.log('- Check Supabase dashboard for any limits or errors');
  console.log('- Run with --expose-gc flag for better memory management');
}

main().catch(console.error); 