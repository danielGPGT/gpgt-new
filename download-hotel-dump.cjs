require('dotenv').config({ path: 'server.env' });
const fetch = require('node-fetch');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const KEY_ID = process.env.ET_API_KEY_ID;
const API_KEY = process.env.ET_API_KEY;
const API_URL = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
const OUTPUT_ZST = path.resolve(__dirname, 'hotel_dump_en.json.zst');
const OUTPUT_JSON = path.resolve(__dirname, 'hotel_dump_en.json');

console.log('✅ Environment variables loaded successfully');
console.log(`📋 API Key ID: ${KEY_ID}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

async function getDumpUrl() {
  try {
    console.log('[STEP] Requesting dump URL from ETG API...');
    const response = await fetch(`${API_URL}/hotel/info/dump/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${KEY_ID}:${API_KEY}`).toString('base64')
      },
      body: JSON.stringify({
        inventory: 'all',
        language: 'en'
      })
    });
    const data = await response.json();
    console.log('[DEBUG] ETG API response:', JSON.stringify(data, null, 2));
    if (!data.data || !data.data.url) {
      throw new Error('Failed to get dump URL: ' + JSON.stringify(data));
    }
    return data.data.url;
  } catch (err) {
    console.error('[ERROR] Failed to get dump URL:', err.stack || err);
    throw err;
  }
}

async function downloadFile(url, dest) {
  try {
    console.log(`[STEP] Downloading .zst file from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
    const fileStream = fs.createWriteStream(dest);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
    console.log(`[STEP] Downloaded to: ${dest}`);
  } catch (err) {
    console.error('[ERROR] Failed to download file:', err.stack || err);
    throw err;
  }
}

async function main() {
  try {
    console.log('[INFO] Starting hotel dump download and decompress script...');
    console.log(`[INFO] Using API URL: ${API_URL}`);
    console.log(`[INFO] Using KEY_ID: ${KEY_ID}`);
    if (!KEY_ID || !API_KEY) {
      throw new Error('Missing ET_API_KEY_ID or ET_API_KEY in environment variables.');
    }
    const url = await getDumpUrl();
    console.log('[INFO] Got download URL:', url);

    await downloadFile(url, OUTPUT_ZST);
    
    console.log('[STEP] Decompressing with zstd...');
    execSync(`zstd -d -f "${OUTPUT_ZST}" -o "${OUTPUT_JSON}"`);
    console.log('[STEP] Decompressed to:', OUTPUT_JSON);
    console.log('[SUCCESS] Hotel dump is ready for import:', OUTPUT_JSON);
  } catch (err) {
    console.error('[FATAL ERROR] Script failed:', err.stack || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}