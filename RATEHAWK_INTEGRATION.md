# RateHawk Hotel Integration

This document describes the RateHawk hotel API integration for the AItinerary application.

## Overview

The RateHawk integration allows travel agents to search for and select real-time hotel options directly within the intake form. This feature is implemented as Step 5 in the multi-step form process.

## Features

- **Real-time Hotel Search**: Search for hotels based on destination, dates, and guest count
- **Room Selection**: Browse available rooms with pricing and amenities
- **Skip Option**: Agents can skip hotel selection if not needed
- **Form Integration**: Selected hotel data is included in the final quote generation

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
VITE_ET_API_URL=https://api.ratehawk.com/v1
VITE_ET_API_KEY=your_ratehawk_api_key
VITE_ET_API_ID=your_ratehawk_api_id
```

### 2. Express Server Integration

The RateHawk API calls are handled through your existing Express server (`server.cjs`) to keep API credentials secure. The server includes:

- `/api/search-hotels` - Hotel search endpoint
- `/api/get-hotel-details` - Hotel details endpoint
- Mock data fallback for development

### 3. Start the Server

Make sure your Express server is running:

```bash
npm run server
```

The server will automatically handle RateHawk API calls and fall back to mock data if the API is unavailable.

## API Structure

### RateHawk Service (`src/lib/api/ratehawk.ts`)

The service provides:
- `searchHotels()`: Search for hotels with given parameters
- `getHotelDetails()`: Get detailed information about a specific hotel
- `getMockHotels()`: Fallback mock data for development

### Types

```typescript
interface RateHawkHotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  language?: string;
}

interface RateHawkHotelWithRooms {
  id: string;
  name: string;
  rating: number;
  stars: number;
  address: { country: string; city: string; street: string; zip: string; };
  location: { latitude: number; longitude: number; };
  images: string[];
  amenities: string[];
  description?: string;
  rooms: RateHawkRoom[];
}
```

## Form Integration

### Step 5: Hotel Selection

The hotel selection step (`StepHotelSelection.tsx`) includes:

1. **Automatic Search**: Triggers hotel search when component mounts
2. **Hotel Cards**: Displays hotels with images, ratings, and amenities
3. **Expandable Rooms**: Click to view available rooms and pricing
4. **Selection**: Radio buttons for room selection
5. **Skip Option**: Toggle to skip hotel selection entirely

### Form Data Structure

```typescript
hotelSelection: {
  skipHotelSelection: boolean;
  selectedHotel?: {
    hotel: RateHawkHotel;
    room: RateHawkRoom;
    selectedAt: string;
  };
  searchParams?: RateHawkHotelSearchParams;
}
```

## Usage

### For Travel Agents

1. Complete Steps 1-4 (Traveler Info, Destinations, Style, Budget)
2. In Step 5, hotels will automatically search based on your criteria
3. Browse available hotels and expand to see room options
4. Select a room or skip hotel selection
5. Continue to Step 6 (Events & Inventory)

### For Developers

#### Adding Hotel Data to Quotes

The selected hotel data is automatically included in quote generation:

```typescript
// In createQuotePayload.ts
selectedHotel: formData.hotelSelection.selectedHotel || undefined,
```

#### Customizing the Search

Modify the search parameters in `StepHotelSelection.tsx`:

```typescript
const searchParams = {
  destination,
  checkIn: startDate,
  checkOut: endDate,
  adults,
  children: children || 0,
  rooms: 1,
  currency: currency || 'USD',
  language: 'en'
};
```

## Error Handling

The integration includes comprehensive error handling:

- **API Failures**: Falls back to mock data for development
- **No Results**: Displays appropriate message when no hotels found
- **Network Issues**: Retry functionality with user feedback
- **Validation**: Ensures required parameters are provided

## Development

### Mock Data

During development, the system uses mock data when the RateHawk API is unavailable. This includes:

- Sample hotels with realistic data
- Multiple room types and pricing
- Amenities and location information

### Testing

To test the integration:

1. Set up environment variables in your `.env` file
2. Start the Express server: `npm run server`
3. Navigate to the intake form
4. Complete steps 1-4
5. Verify hotel search works in Step 5

### Test Component

Use the `RateHawkTest` component to test the API independently:

```typescript
import { RateHawkTest } from '@/components/RateHawkTest';

// Add to any page for testing
<RateHawkTest />
```

## Troubleshooting

### Common Issues

1. **No hotels found**: Check destination spelling and date format
2. **API errors**: Verify environment variables and API credentials
3. **Loading issues**: Check network connectivity and server status
4. **Server not running**: Make sure `npm run server` is running

### Debug Mode

Enable debug logging by checking the browser console for:
- Search parameters being sent
- API response data
- Error messages

Check the server console for:
- RateHawk API requests
- Response status codes
- Error details

## Server Endpoints

### POST /api/search-hotels

Search for hotels with the given parameters.

**Request Body:**
```json
{
  "destination": "Paris",
  "checkIn": "2024-12-15",
  "checkOut": "2024-12-18",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "currency": "USD",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hotels": [...],
    "totalResults": 2,
    "searchId": "search_123"
  }
}
```

### POST /api/get-hotel-details

Get detailed information about a specific hotel.

**Request Body:**
```json
{
  "hotelId": "hotel_1",
  "destination": "Paris",
  "checkIn": "2024-12-15",
  "checkOut": "2024-12-18",
  "adults": 2
}
```

## Future Enhancements

Potential improvements:
- Price filtering
- Star rating filtering
- Amenity filtering
- Hotel comparison view
- Booking integration
- Commission calculation preview

## Support

For issues with the RateHawk integration:
1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Ensure the Express server is running
4. Review RateHawk API documentation for endpoint changes 