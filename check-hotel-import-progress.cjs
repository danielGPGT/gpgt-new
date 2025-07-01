console.log('[DEBUG] Hotel import progress checker started');
require('dotenv').config({ path: 'server.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkImportProgress() {
  console.log('[INFO] Checking hotel import progress...\n');
  
  try {
    // Get total count of hotels
    const { count: totalHotels, error: countError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[ERROR] Failed to get hotel count:', countError);
      return;
    }
    
    console.log(`📊 Total hotels in database: ${totalHotels.toLocaleString()}`);
    
    // Get count of hotels with HID
    const { count: hotelsWithHID, error: hidError } = await supabase
      .from('hotels')
      .select('hid', { count: 'exact', head: true })
      .not('hid', 'is', null);
    
    if (hidError) {
      console.error('[ERROR] Failed to get HID count:', hidError);
      return;
    }
    
    console.log(`🎯 Hotels with HID: ${hotelsWithHID.toLocaleString()}`);
    console.log(`📈 HID coverage: ${((hotelsWithHID / totalHotels) * 100).toFixed(1)}%`);
    
    // Get sample of hotels with HID
    const { data: sampleHotels, error: sampleError } = await supabase
      .from('hotels')
      .select('id, name, hid, city, country')
      .not('hid', 'is', null)
      .limit(5);
    
    if (sampleError) {
      console.error('[ERROR] Failed to get sample hotels:', sampleError);
      return;
    }
    
    console.log('\n🔍 Sample hotels with HID:');
    sampleHotels.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.name} (ID: ${hotel.id}, HID: ${hotel.hid})`);
      console.log(`     Location: ${hotel.city}, ${hotel.country}`);
    });
    
    // Get hotels without HID
    const { data: hotelsWithoutHID, error: noHidError } = await supabase
      .from('hotels')
      .select('id, name, city, country')
      .is('hid', null)
      .limit(5);
    
    if (noHidError) {
      console.error('[ERROR] Failed to get hotels without HID:', noHidError);
      return;
    }
    
    console.log('\n⚠️ Sample hotels WITHOUT HID:');
    hotelsWithoutHID.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.name} (ID: ${hotel.id})`);
      console.log(`     Location: ${hotel.city}, ${hotel.country}`);
    });
    
    // Get country distribution
    const { data: countryStats, error: countryError } = await supabase
      .from('hotels')
      .select('country')
      .not('country', 'is', null);
    
    if (countryError) {
      console.error('[ERROR] Failed to get country stats:', countryError);
      return;
    }
    
    const countryCounts = {};
    countryStats.forEach(hotel => {
      countryCounts[hotel.country] = (countryCounts[hotel.country] || 0) + 1;
    });
    
    const topCountries = Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('\n🌍 Top 10 countries by hotel count:');
    topCountries.forEach(([country, count], index) => {
      console.log(`  ${index + 1}. ${country}: ${count.toLocaleString()} hotels`);
    });
    
    // Get city distribution
    const { data: cityStats, error: cityError } = await supabase
      .from('hotels')
      .select('city')
      .not('city', 'is', null);
    
    if (cityError) {
      console.error('[ERROR] Failed to get city stats:', cityError);
      return;
    }
    
    const cityCounts = {};
    cityStats.forEach(hotel => {
      cityCounts[hotel.city] = (cityCounts[hotel.city] || 0) + 1;
    });
    
    const topCities = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('\n🏙️ Top 10 cities by hotel count:');
    topCities.forEach(([city, count], index) => {
      console.log(`  ${index + 1}. ${city}: ${count.toLocaleString()} hotels`);
    });
    
    console.log('\n✅ Progress check completed!');
    
  } catch (error) {
    console.error('[FATAL ERROR]', error);
  }
}

checkImportProgress(); 