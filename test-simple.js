import fs from 'fs';
import fetch from 'node-fetch';

async function testDumpFile() {
  console.log('--- Checking hotel dump file ---');
  const filePath = './data/hotels_dump.json';
  
  try {
    const stats = fs.statSync(filePath);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    console.log(`Total lines: ${lines.length}`);
    
    if (lines.length > 0) {
      console.log('First line preview:', lines[0].substring(0, 100) + '...');
    }
  } catch (err) {
    console.log('Error reading file:', err.message);
  }
}

async function testSearch() {
  console.log('\n--- Testing search endpoint ---');
  try {
    const response = await fetch('http://localhost:3001/api/search-hotels?query=Paris&checkIn=2025-08-22&checkOut=2025-08-29&adults=2');
    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} hotels`);
    if (data.data && data.data.length > 0) {
      console.log('First hotel:', data.data[0].name);
    }
  } catch (err) {
    console.log('Search error:', err.message);
  }
}

testDumpFile().then(testSearch); 