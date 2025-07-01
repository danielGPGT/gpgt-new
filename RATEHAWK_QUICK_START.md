# RateHawk Integration - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Add Environment Variables

Add these to your `.env` file:

```env
VITE_ET_API_URL=https://api.ratehawk.com/v1
VITE_ET_API_KEY=your_ratehawk_api_key_here
VITE_ET_API_ID=your_ratehawk_api_id_here
```

### Step 2: Start Your Server

```bash
npm run server
```

### Step 3: Test the Integration

1. Navigate to your intake form
2. Complete Steps 1-4 (Traveler Info, Destinations, Style, Budget)
3. In Step 5, you'll see the hotel selection interface
4. Hotels will automatically search based on your criteria

## 🧪 Testing Without API Keys

If you don't have RateHawk API keys yet, the system will automatically use mock data:

1. Start the server: `npm run server`
2. The hotel search will work with sample data
3. You can test the full UI/UX experience

## 📁 Files Created/Modified

### New Files:
- `src/lib/api/ratehawk.ts` - RateHawk API service
- `src/components/forms/steps/StepHotelSelection.tsx` - Hotel selection step
- `src/components/RateHawkTest.tsx` - Test component
- `RATEHAWK_INTEGRATION.md` - Full documentation

### Modified Files:
- `server.cjs` - Added hotel search endpoints
- `src/components/forms/IntakeForm.tsx` - Added Step 5
- `src/types/trip.ts` - Added hotel selection types
- `src/utils/createQuotePayload.ts` - Includes hotel data in quotes

## 🎯 What You Get

✅ **Real-time hotel search** (or mock data if API unavailable)
✅ **Professional hotel cards** with images, ratings, amenities
✅ **Room selection** with pricing and cancellation policies
✅ **Skip option** for agents who don't need hotels
✅ **Form integration** - selected hotels included in quotes
✅ **Error handling** with fallback to mock data
✅ **Responsive design** using ShadCN components

## 🔧 Troubleshooting

### Server Not Starting
```bash
# Check if port 3001 is available
netstat -ano | findstr :3001
```

### No Hotels Showing
- Check browser console for errors
- Verify server is running on port 3001
- Check network tab for API calls

### API Errors
- Verify environment variables are set
- Check RateHawk API credentials
- System will fall back to mock data automatically

## 🎉 Ready to Use!

The RateHawk integration is now fully functional. Travel agents can:

1. Search for hotels based on destination and dates
2. Browse available rooms with pricing
3. Select hotels to include in their quotes
4. Skip hotel selection if not needed

The selected hotel data will be automatically included in AI-generated itineraries! 