import fs from 'fs';
import readline from 'readline';
import fetch from 'node-fetch';

async function printFirstHotelsFromDump() {
  const filePath = './data/hotels_dump.json';
  console.log('--- Reading first 3 hotels from hotel dump ---');
  try {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let count = 0;
    for await (const line of rl) {
      if (line.trim()) {
        try {
          const hotel = JSON.parse(line);
          console.log(hotel);
          count++;
        } catch (e) {
          console.log('Error parsing line:', e.message);
        }
      }
      if (count >= 3) break;
    }
    if (count === 0) {
      console.log('No hotels found in dump or file is empty.');
    }
  } catch (err) {
    console.log('Error reading hotel dump:', err.message);
  }
}

async function testHotelSearch() {
  console.log('\n--- Testing /api/search-hotels for Paris, 22-29 Aug 2025 ---');
  const url = 'http://localhost:3001/api/search-hotels?query=Paris&checkIn=2025-08-22&checkOut=2025-08-29&adults=2&children=0&rooms=1';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('Search endpoint error:', response.status, await response.text());
      return;
    }
    const data = await response.json();
    console.log('Search result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error calling search endpoint:', err.message);
  }
}

(async function() {
  await printFirstHotelsFromDump();
  await testHotelSearch();
})(); 