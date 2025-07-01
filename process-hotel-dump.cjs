console.log('[INFO] Starting hotel dump processing...');
const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');

const INPUT_FILE = './hotel-data/hotel_dump_en.json.zst';
const OUTPUT_FILE = './hotel-data/hotel_dump_en.json';
const SAMPLE_FILE = './hotel-data/hotel_dump_sample.json';

// Check if input file exists
if (!fs.existsSync(INPUT_FILE)) {
  console.error(`[ERROR] Input file not found: ${INPUT_FILE}`);
  process.exit(1);
}

console.log(`[INFO] Input file: ${INPUT_FILE}`);
console.log(`[INFO] Output file: ${OUTPUT_FILE}`);
console.log(`[INFO] Sample file: ${SAMPLE_FILE}`);

// Function to decompress the file
function decompressFile() {
  return new Promise((resolve, reject) => {
    console.log('[INFO] Decompressing file...');
    
    const zstd = spawn('zstd', ['-d', INPUT_FILE, '-o', OUTPUT_FILE]);
    
    zstd.stdout.on('data', (data) => {
      console.log(`[INFO] zstd output: ${data}`);
    });
    
    zstd.stderr.on('data', (data) => {
      console.log(`[INFO] zstd progress: ${data}`);
    });
    
    zstd.on('close', (code) => {
      if (code === 0) {
        console.log('[SUCCESS] File decompressed successfully');
        resolve();
      } else {
        console.error(`[ERROR] zstd process exited with code ${code}`);
        reject(new Error(`zstd process exited with code ${code}`));
      }
    });
    
    zstd.on('error', (error) => {
      console.error('[ERROR] Failed to start zstd process:', error);
      reject(error);
    });
  });
}

// Function to create a sample file for inspection
function createSampleFile() {
  return new Promise((resolve, reject) => {
    console.log('[INFO] Creating sample file for inspection...');
    
    const readStream = fs.createReadStream(OUTPUT_FILE, { encoding: 'utf8' });
    const writeStream = fs.createWriteStream(SAMPLE_FILE);
    
    let lineCount = 0;
    const maxLines = 10; // First 10 lines
    
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    });
    
    rl.on('line', (line) => {
      if (lineCount < maxLines) {
        writeStream.write(line + '\n');
        lineCount++;
      } else {
        rl.close();
      }
    });
    
    rl.on('close', () => {
      writeStream.end();
      console.log(`[SUCCESS] Sample file created with ${lineCount} lines`);
      resolve();
    });
    
    rl.on('error', (error) => {
      console.error('[ERROR] Error reading file:', error);
      reject(error);
    });
  });
}

// Function to analyze the file structure
function analyzeFileStructure() {
  return new Promise((resolve, reject) => {
    console.log('[INFO] Analyzing file structure...');
    
    const readStream = fs.createReadStream(OUTPUT_FILE, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    });
    
    let lineCount = 0;
    let validJsonCount = 0;
    let invalidJsonCount = 0;
    let sampleData = null;
    
    rl.on('line', (line) => {
      lineCount++;
      
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          validJsonCount++;
          
          // Save first valid JSON for inspection
          if (!sampleData) {
            sampleData = parsed;
          }
        } catch (error) {
          invalidJsonCount++;
        }
      }
      
      // Stop after 1000 lines for analysis
      if (lineCount >= 1000) {
        rl.close();
      }
    });
    
    rl.on('close', () => {
      console.log(`[ANALYSIS] File structure analysis:`);
      console.log(`[ANALYSIS] - Total lines checked: ${lineCount}`);
      console.log(`[ANALYSIS] - Valid JSON lines: ${validJsonCount}`);
      console.log(`[ANALYSIS] - Invalid JSON lines: ${invalidJsonCount}`);
      
      if (sampleData) {
        console.log(`[ANALYSIS] - Sample data structure:`);
        console.log(`[ANALYSIS]   Keys: ${Object.keys(sampleData).join(', ')}`);
        
        if (sampleData.data) {
          console.log(`[ANALYSIS]   Data keys: ${Object.keys(sampleData.data).join(', ')}`);
        }
      }
      
      resolve();
    });
    
    rl.on('error', (error) => {
      console.error('[ERROR] Error analyzing file:', error);
      reject(error);
    });
  });
}

// Main processing function
async function processHotelDump() {
  try {
    // Step 1: Decompress the file
    await decompressFile();
    
    // Step 2: Create a sample file for inspection
    await createSampleFile();
    
    // Step 3: Analyze the file structure
    await analyzeFileStructure();
    
    console.log('\n[SUCCESS] Hotel dump processing completed!');
    console.log(`[INFO] Full file: ${OUTPUT_FILE}`);
    console.log(`[INFO] Sample file: ${SAMPLE_FILE}`);
    console.log('[INFO] You can now inspect the sample file to understand the data structure');
    
  } catch (error) {
    console.error('[FATAL ERROR]', error);
    process.exit(1);
  }
}

// Run the processing
processHotelDump(); 