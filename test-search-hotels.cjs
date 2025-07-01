const fetch = require('node-fetch');
require('dotenv').config({ path: 'server.env' });

const SUPABASE_FUNCTION_URL = 'https://borzlwjczgskbcxkxxei.functions.supabase.co/search-hotels';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testHotelSearch() {
  const payload = {
    destination: 'Paris',
    checkIn: '2025-08-15',
    checkOut: '2025-08-17',
    adults: 2,
    children: 0,
    rooms: 1,
    currency: 'USD',
    language: 'en'
  };

  try {
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testHotelSearch(); 