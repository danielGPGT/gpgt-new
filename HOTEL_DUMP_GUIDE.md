# Hotel Dump Integration Guide

This guide explains how to use the ETG (Emerging Travel Group) hotel dump system for enhanced hotel search capabilities in your AItinerary application.

## Overview

The ETG B2B workflow consists of two main components:
1. **Hotel Dump**: A complete database of all available hotels with static content
2. **Real-time Search**: API calls for availability and pricing

## Files Overview

### Core Scripts

- **`download-hotel-dump.cjs`**: Downloads and processes the complete hotel dump
- **`search-hotels-local.cjs`**: Provides local search functionality using the dump data
- **`integrate-hotel-search.cjs`**: Combines API search with local data enrichment

### Data Files (Generated)

- **`data/hotel_index.json`**: Processed and indexed hotel data
- **`data/sample_hotels.json`**: Sample hotel records for testing
- **`data/hotels_dump.json`**: Raw hotel dump (large file, can be deleted after processing)

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` file contains the ETG API credentials:

```env
ET_API_KEY_ID=your_key_id_here
ET_API_KEY=your_api_key_here
```

### 2. Download Hotel Dump

Run the download script to get the complete hotel database:

```bash
node download-hotel-dump.cjs
```

This will:
- Request the hotel dump URL from ETG API
- Download the compressed dump file
- Decompress and parse the JSON data
- Create searchable indexes
- Save processed data to `data/` directory

**Expected Output:**
```
🚀 Starting hotel dump download...
📡 Response status: 200
📋 API Response: { "data": { "url": "...", "last_update": "..." } }
📥 Downloading file from: https://example.com/feed/dump_en.json.zst
📊 Download progress: 100%
✅ Download completed!
🔧 Decompressing file...
✅ Decompression completed!
📖 Parsing hotel data...
📊 Processed 50000 lines...
✅ Parsed 45000 hotels from 50000 lines
🔍 Creating hotel index...
✅ Created index with 45000 hotels
📊 Stats: 150 countries, 2500 cities, 500 chains
🎉 Hotel dump processing completed successfully!
```

### 3. Test Local Search

Test the local search functionality:

```bash
node search-hotels-local.cjs
```

This will demonstrate:
- Database statistics
- Name-based search
- Location-based search
- Popular destinations
- Hotel chains

### 4. Test Integrated Search

Test the combined API + local search:

```bash
node integrate-hotel-search.cjs
```

This will show:
- Enhanced search results
- Data enrichment capabilities
- Fallback mechanisms

## Usage in Your Application

### Basic Local Search

```javascript
const LocalHotelSearch = require('./search-hotels-local.cjs');

const search = new LocalHotelSearch();

// Search by name
const hotels = search.searchByName('Marriott', 10);

// Search by location
const hotels = search.searchByLocation('US', 'New York', 10);

// Get hotel by ID
const hotel = search.getHotelById('12345');
```

### Enhanced Search with API Integration

```javascript
const IntegratedHotelSearch = require('./integrate-hotel-search.cjs');

const search = new IntegratedHotelSearch();

// Enhanced search with local data enrichment
const results = await search.enhancedSearch({
  country: 'US',
  city: 'New York',
  checkIn: '2024-12-15',
  checkOut: '2024-12-17',
  adults: 2,
  children: 0,
  rooms: 1,
  limit: 20
});

// Search with fallback to local data
const results = await search.searchWithFallback({
  country: 'US',
  city: 'Los Angeles',
  checkIn: '2024-12-15',
  checkOut: '2024-12-17',
  limit: 10
});
```

## Data Structure

### Hotel Index Structure

```json
{
  "byId": {
    "12345": {
      "id": "12345",
      "name": "Hotel Name",
      "country": "US",
      "city": "New York",
      "address": "123 Main St",
      "chain": "Marriott",
      "amenities": ["WiFi", "Pool", "Gym"],
      "phone": "+1-555-1234",
      "email": "info@hotel.com",
      "checkIn": "15:00",
      "checkOut": "11:00"
    }
  },
  "byName": {
    "hotel name": [hotel_objects]
  },
  "byLocation": {
    "us_new york": [hotel_objects]
  },
  "stats": {
    "total": 45000,
    "countries": ["US", "UK", "FR", ...],
    "cities": ["New York", "London", "Paris", ...],
    "chains": ["Marriott", "Hilton", "Hyatt", ...]
  }
}
```

### Enhanced Search Results

```javascript
{
  hotels: [
    {
      hid: "12345",
      name: "Hotel Name",
      country: "US",
      city: "New York",
      // API data
      price: 150,
      currency: "USD",
      // Local enrichment
      localData: {
        chain: "Marriott",
        amenities: ["WiFi", "Pool"],
        phone: "+1-555-1234"
      },
      enriched: true
    }
  ],
  searchParams: {...},
  totalFound: 20,
  enrichedCount: 15
}
```

## Integration with Your Backend

### Update Your Express Server

Add these endpoints to your `server.cjs`:

```javascript
const IntegratedHotelSearch = require('./integrate-hotel-search.cjs');

// Initialize search
const hotelSearch = new IntegratedHotelSearch();

// Enhanced hotel search endpoint
app.post('/api/hotels/search/enhanced', async (req, res) => {
  try {
    const results = await hotelSearch.enhancedSearch(req.body);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback search endpoint
app.post('/api/hotels/search/fallback', async (req, res) => {
  try {
    const results = await hotelSearch.searchWithFallback(req.body);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Local search endpoint
app.get('/api/hotels/search/local', (req, res) => {
  try {
    const { name, country, city, limit = 10 } = req.query;
    const search = new LocalHotelSearch();
    
    let results = [];
    if (name) {
      results = search.searchByName(name, parseInt(limit));
    } else if (country && city) {
      results = search.searchByLocation(country, city, parseInt(limit));
    }
    
    res.json({ hotels: results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Update Your Frontend

Update your hotel search components to use the enhanced endpoints:

```typescript
// Enhanced search with local data enrichment
const searchHotels = async (params: SearchParams) => {
  const response = await fetch('/api/hotels/search/enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const results = await response.json();
  
  // Display enriched hotel information
  return results.hotels.map(hotel => ({
    ...hotel,
    displayName: hotel.localData?.name || hotel.name,
    amenities: hotel.localData?.amenities || [],
    chain: hotel.localData?.chain,
    phone: hotel.localData?.phone,
    email: hotel.localData?.email
  }));
};
```

## Maintenance

### Regular Updates

The ETG updates the hotel dump weekly. To keep your data current:

1. **Automated Updates**: Set up a cron job to run `download-hotel-dump.cjs` weekly
2. **Manual Updates**: Run the script manually when needed
3. **Incremental Updates**: Use the incremental dump API for smaller updates

### Storage Considerations

- **Raw dump file**: ~500MB (can be deleted after processing)
- **Processed index**: ~100MB
- **Sample data**: ~1MB

### Performance Optimization

- **Memory usage**: The index loads ~100MB into memory
- **Search speed**: O(1) for ID lookups, O(n) for name/location searches
- **Caching**: Consider Redis for frequently accessed data

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   ```
   ❌ Missing environment variables: ET_API_KEY_ID and ET_API_KEY
   ```
   Solution: Check your `.env` file

2. **Dump not ready**
   ```
   ❌ Hotel dump is not ready. Please try again later.
   ```
   Solution: Wait and retry later

3. **Large file download**
   ```
   ❌ Download failed: timeout
   ```
   Solution: Increase timeout settings or use a stable connection

4. **Memory issues during processing**
   ```
   ❌ JavaScript heap out of memory
   ```
   Solution: Increase Node.js memory limit: `node --max-old-space-size=4096 download-hotel-dump.cjs`

### Debug Mode

Add debug logging to any script:

```javascript
process.env.DEBUG = 'true';
```

## Benefits

1. **Faster Search**: Local data provides instant results
2. **Richer Information**: Static content includes amenities, contact info, etc.
3. **Offline Capability**: Works without API calls
4. **Cost Effective**: Reduces API usage
5. **Better UX**: More detailed hotel information
6. **Fallback Support**: Continues working if API is unavailable

## Next Steps

1. Run the download script to get your hotel database
2. Test the local search functionality
3. Integrate enhanced search into your backend
4. Update your frontend to display enriched hotel data
5. Set up automated updates for fresh data

This system provides a robust foundation for hotel search in your AItinerary application, combining the best of real-time API data with comprehensive static content. 