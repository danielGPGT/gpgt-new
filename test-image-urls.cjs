console.log('Testing image URL processing...');

// Test the image URL processing logic
function processImageUrl(originalUrl) {
  if (typeof originalUrl === 'string' && originalUrl.includes('{size}')) {
    return originalUrl.replace('{size}', '240x240');
  }
  return originalUrl;
}

// Test URLs from the hotel data
const testUrls = [
  'https://cdn.worldota.net/t/{size}/content/e8/f1/e8f1470d5985e417434890e30bd527ecf5edf124.jpeg',
  'https://cdn.worldota.net/t/{size}/content/d4/96/d496093fb63d3c7625d442ccd0cac5481e191726.jpeg',
  'https://cdn.worldota.net/t/{size}/content/5f/d9/5fd9a14ac6cd2602a5185d638be94c0395e111b9.jpeg'
];

console.log('\nOriginal URLs:');
testUrls.forEach(url => console.log(url));

console.log('\nProcessed URLs:');
testUrls.forEach(url => {
  const processed = processImageUrl(url);
  console.log(processed);
});

console.log('\nTesting with fetch to check if URLs are accessible...');

// Test if the processed URLs are accessible
async function testUrlAccessibility() {
  for (const url of testUrls) {
    const processedUrl = processImageUrl(url);
    try {
      console.log(`\nTesting: ${processedUrl}`);
      const response = await fetch(processedUrl, { method: 'HEAD' });
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        console.log('✅ URL is accessible');
      } else {
        console.log('❌ URL returned error');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testUrlAccessibility(); 