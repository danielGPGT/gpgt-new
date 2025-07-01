import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination, checkIn, checkOut, adults, children, rooms, currency, language } = await req.json()

    console.log('🔍 Search request received:', { destination, checkIn, checkOut, adults, children, rooms, currency, language });

    // Validate required parameters
    if (!destination || !checkIn || !checkOut || !adults) {
      console.log('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const apiUrl = Deno.env.get('ET_API_URL')
    const apiKey = Deno.env.get('ET_API_KEY')
    const apiId = Deno.env.get('ET_API_KEY_ID')

    console.log('🔧 Environment variables check:');
    console.log('- API URL:', apiUrl ? 'SET' : 'NOT SET');
    console.log('- API Key:', apiKey ? 'SET' : 'NOT SET');
    console.log('- API ID:', apiId ? 'SET' : 'NOT SET');

    if (!apiUrl || !apiKey || !apiId) {
      console.error('❌ RateHawk API credentials not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test Basic auth encoding
    const authString = `${apiId}:${apiKey}`;
    const encodedAuth = btoa(authString);
    console.log('🔐 Auth test:');
    console.log('- Auth string length:', authString.length);
    console.log('- Encoded auth length:', encodedAuth.length);
    console.log('- Full API URL for region search:', `${apiUrl}/search/multicomplete/`);

    // Prepare the request payload for RateHawk API
    const searchPayload = {
      query: destination,
      language: language || 'en'
    }

    console.log('📤 Making request to RateHawk API with payload:', JSON.stringify(searchPayload, null, 2));

    // Step 1: Search for regions using multicomplete
    console.log('🔄 Step 1: Calling region search API...');
    const regionResponse = await fetch(`${apiUrl}/search/multicomplete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + encodedAuth
      },
      body: JSON.stringify(searchPayload)
    })

    console.log('📥 Region search response status:', regionResponse.status);
    console.log('📥 Region search response headers:', Object.fromEntries(regionResponse.headers.entries()));

    if (!regionResponse.ok) {
      const errorText = await regionResponse.text()
      console.error('❌ RateHawk region search error:', regionResponse.status, errorText)
      
      // Return mock data for development if API fails
      console.log('🔄 Falling back to mock data due to region search error');
      return new Response(
        JSON.stringify(getMockHotels()),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const regionData = await regionResponse.json()
    console.log('✅ Region search successful');
    console.log('📊 Region response structure:', {
      hasData: !!regionData.data,
      hasRegions: !!regionData.data?.regions,
      regionCount: regionData.data?.regions?.length || 0
    });
    console.log('Found regions:', regionData.data?.regions?.length || 0);

    if (!regionData.data?.regions || regionData.data.regions.length === 0) {
      console.error('❌ No regions found for destination:', destination);
      console.log('🔍 Full region response:', JSON.stringify(regionData, null, 2));
      return new Response(
        JSON.stringify({ error: 'No regions found for destination' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const firstRegion = regionData.data.regions[0];
    console.log('Using region:', firstRegion.name, `(ID: ${firstRegion.id})`);

    // Step 2: Search for hotels using the region ID
    const hotelPayload = {
      region_id: firstRegion.id,
      checkin: checkIn,
      checkout: checkOut,
      guests: [{ adults: adults, children: children ? Array(children).fill(14) : [] }],
      hotels_limit: 20,
      language: language || 'en',
      currency: currency || 'USD'
    }

    console.log('📤 Making hotel search request with payload:', JSON.stringify(hotelPayload, null, 2));
    console.log('🔄 Step 2: Calling hotel search API...');
    console.log('- Full API URL for hotel search:', `${apiUrl}/search/serp/region/`);

    const response = await fetch(`${apiUrl}/search/serp/region/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + encodedAuth
      },
      body: JSON.stringify(hotelPayload)
    })

    console.log('📥 Hotel search response status:', response.status);
    console.log('📥 Hotel search response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ RateHawk hotel search error:', response.status, errorText)
      
      // Return mock data for development if API fails
      console.log('🔄 Falling back to mock data due to hotel search error');
      return new Response(
        JSON.stringify(getMockHotels()),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('✅ RateHawk hotel search successful');
    console.log('📊 Response structure:', {
      hasHotels: !!data.data,
      hotelCount: data.data ? data.data.hotels ? data.data.hotels.length : 0 : 0,
      firstHotelId: data.data && data.data.hotels && data.data.hotels.length > 0 ? data.data.hotels[0].id : 'none'
    });
    
    // Add detailed response logging
    console.log('🔍 Full RateHawk response keys:', Object.keys(data));
    console.log('🔍 Data structure:', {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : 'no data',
      hasHotelsInData: data.data ? !!data.data.hotels : false,
      hotelCountInData: data.data && data.data.hotels ? data.data.hotels.length : 0
    });
    
    if (data.data && data.data.hotels) {
      console.log('🏨 First hotel in data:', {
        id: data.data.hotels[0]?.id,
        name: data.data.hotels[0]?.name,
        hasRates: !!data.data.hotels[0]?.rates,
        rateCount: data.data.hotels[0]?.rates?.length || 0
      });
    }
    
    // Log the full response for debugging
    console.log('📄 Full API Response:', JSON.stringify(data, null, 2));

    // Transform RateHawk response to our format
    console.log('🔄 Starting response transformation...');
    const transformedData = await transformRateHawkResponse(data)
    console.log('✅ Response transformation completed');

    return new Response(
      JSON.stringify(transformedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Search hotels error:', error)
    
    // Return mock data for development
    console.log('🔄 Falling back to mock data due to error');
    return new Response(
      JSON.stringify(getMockHotels()),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function transformRateHawkResponse(data: any) {
  // 1. Extract hotel IDs and maximum rooms per hotel (increased to 50)
  let maxRoomsFound = 0;
  const hotels = (data.data?.hotels || []).map((hotel: any) => {
    const totalRooms = hotel.rates?.length || 0;
    maxRoomsFound = Math.max(maxRoomsFound, totalRooms);
    
    // Sort rooms by price, pick up to 20 cheapest (limit to 20 rooms)
    const cheapestRooms = (hotel.rates || [])
      .sort((a: any, b: any) => a.payment_options?.payment_types?.[0]?.amount - b.payment_options?.payment_types?.[0]?.amount)
      .slice(0, 20); // Limit to 20 rooms

    console.log(`🏨 Hotel ${hotel.id}: ${totalRooms} total rooms available, returning ${cheapestRooms.length} rooms`);

    return {
      id: hotel.id,
      hid: hotel.hid, // Also store the numeric HID
      rates: cheapestRooms.map((room: any) => ({
        id: room.match_hash,
        name: room.room_name,
        price: {
          amount: room.payment_options?.payment_types?.[0]?.amount || 0,
          currency: room.payment_options?.payment_types?.[0]?.currency_code || 'USD'
        },
        refundable: true, // Default for now
        available: true, // Default for now
        boardType: room.meal_data?.value || 'Room Only',
      })),
    };
  });

  console.log(`🔍 Maximum rooms found per hotel: ${maxRoomsFound}`);
  console.log('🔍 Extracted hotels from API:', hotels.length);
  console.log('🔍 Hotel IDs:', hotels.map(h => h.id));
  console.log('🔍 Hotel HIDs:', hotels.map(h => h.hid));

  // 2. Fetch static hotel data by HID for direct matching
  const hids = hotels.map(h => h.hid).filter(hid => hid != null);
  const staticData = await fetchStaticHotelDataByHID(hids);
  console.log('🔍 Static data found by HID:', staticData.length);

  // 3. Merge static and dynamic data using direct HID matching
  const merged = hotels.map(hotel => {
    // Try direct HID matching first
    const matchedStaticHotel = staticData.find((s: any) => s.hid === hotel.hid);
    
    if (matchedStaticHotel) {
      console.log('✅ Direct HID match found:', hotel.hid, '->', matchedStaticHotel.id);
      
      // Process images properly - replace {size} placeholders
      const processedImages = (matchedStaticHotel.images || []).map((img: string) => {
        if (typeof img === 'string' && img.includes('{size}')) {
          // Use 240x240 which is commonly used and should work with the CDN
          return img.replace('{size}', '240x240');
        }
        return img;
      });

      // Process room groups if available
      const processedRoomGroups = (matchedStaticHotel.room_groups || []).map((group: any) => ({
        room_group_id: group.room_group_id,
        name: group.name,
        images: (group.images || []).map((img: string) => {
          if (typeof img === 'string' && img.includes('{size}')) {
            return img.replace('{size}', '240x240');
          }
          return img;
        }),
        images_ext: group.images_ext,
        room_amenities: group.room_amenities || [],
        name_struct: group.name_struct || {
          bathroom: '',
          bedding_type: null,
          main_name: group.name
        },
        rg_ext: group.rg_ext || {
          balcony: 0,
          bathroom: 0,
          bedding: 0,
          bedrooms: 0,
          capacity: 0,
          class: 0,
          club: 0,
          family: 0,
          floor: 0,
          quality: 0,
          sex: 0,
          view: 0
        }
      }));

      console.log(`🏨 Processing hotel: ${matchedStaticHotel.name} (${matchedStaticHotel.hid})`);
      console.log(`📸 Hotel has ${processedImages.length} images`);
      console.log(`🛏️ Hotel has ${processedRoomGroups.length} room groups:`, processedRoomGroups.map(rg => ({
        name: rg.name,
        images: rg.images?.length || 0,
        amenities: rg.room_amenities?.length || 0
      })));

      // Transform RateHawk rooms and match with room groups
      const transformedRooms = hotel.rates.map((room: any) => {
        // Try to find matching room group by name similarity
        let matchingRoomGroup = processedRoomGroups.find((group: any) => {
          const roomName = room.name?.toLowerCase() || '';
          const groupName = group.name?.toLowerCase() || '';
          const mainName = group.name_struct?.main_name?.toLowerCase() || '';
          
          // More flexible matching - check for common room type keywords
          const roomKeywords = ['standard', 'deluxe', 'suite', 'executive', 'premium', 'superior', 'junior', 'presidential'];
          const hasMatchingKeyword = roomKeywords.some(keyword => 
            roomName.includes(keyword) && groupName.includes(keyword)
          );
          
          // Check if room name contains group name or vice versa
          const nameMatch = roomName.includes(groupName) || 
                           groupName.includes(roomName) ||
                           roomName.includes(mainName) ||
                           mainName.includes(roomName);
          
          return nameMatch || hasMatchingKeyword;
        });

        // If no exact match, try to find any room group with images
        if (!matchingRoomGroup && processedRoomGroups.length > 0) {
          matchingRoomGroup = processedRoomGroups.find(group => group.images && group.images.length > 0);
        }

        console.log(`🔍 Room "${room.name}" matched with group:`, matchingRoomGroup?.name, 'Images:', matchingRoomGroup?.images?.length || 0);

        return {
          id: room.id || room.match_hash || `room_${Date.now()}_${Math.random()}`,
          name: room.name || room.room_name || 'Standard Room',
          type: room.type || room.room_data_trans?.main_room_type || 'Standard',
          capacity: {
            adults: room.capacity?.adults || room.rg_ext?.capacity || 2,
            children: room.capacity?.children || 0
          },
          price: {
            amount: room.price?.amount || room.payment_options?.payment_types?.[0]?.amount || 200,
            currency: room.price?.currency || room.payment_options?.payment_types?.[0]?.currency_code || 'USD',
            originalAmount: room.price?.originalAmount
          },
          cancellationPolicy: room.cancellationPolicy || 'Free cancellation until 24h before check-in',
          boardType: room.boardType || room.meal_data?.value || 'Room Only',
          refundable: room.refundable !== false,
          available: room.available !== false,
          roomGroupId: matchingRoomGroup?.room_group_id,
          images: matchingRoomGroup?.images || [],
          amenities: matchingRoomGroup?.room_amenities || [],
          description: room.description || matchingRoomGroup?.name || 'Comfortable room with modern amenities'
        };
      });
      
      return {
        ...matchedStaticHotel,
        ...hotel,
        // Use processed images
        images: processedImages.length > 0 ? processedImages : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ],
        // Include room groups
        roomGroups: processedRoomGroups,
        // Use transformed rooms with images
        rooms: transformedRooms,
        // Keep the RateHawk ID for reference but use database ID as primary
        ratehawk_id: hotel.id,
        ratehawk_hid: hotel.hid,
      };
    } else {
      console.log('⚠️ No HID match found for hotel:', hotel.id, 'HID:', hotel.hid, '- creating fallback');
      return createFallbackHotel(hotel);
    }
  });

  console.log('🔍 Final merged hotels:', merged.length);

  // Only include hotels with 4 or 5 stars
  const filteredMerged = merged.filter(hotel => {
    const stars = hotel.star_rating || hotel.stars;
    return stars === 4 || stars === 5;
  });

  return { hotels: filteredMerged };
}

// Direct HID matching function - much more efficient than fuzzy matching
async function fetchStaticHotelDataByHID(hids: number[]) {
  if (hids.length === 0) return [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('hotels')
      .select('id, name, address, city, country, region_id, latitude, longitude, amenities, star_rating, hotel_chain, kind, images, room_groups, is_closed, hid')
      .in('hid', hids);

    if (error) {
      console.error('Error fetching static hotel data:', error);
      return [];
    }

    console.log(`🔍 Fetched ${data?.length || 0} hotels from database by HID`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchStaticHotelDataByHID:', error);
    return [];
  }
}

// Create a fallback hotel object when no match is found
function createFallbackHotel(ratehawkHotel: any) {
  const readableName = ratehawkHotel.id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    id: ratehawkHotel.id, // Use RateHawk ID as primary ID
    name: readableName,
    rating: 4.0, // Default rating
    stars: 3, // Default stars
    address: {
      country: 'Unknown',
      city: 'Unknown',
      street: 'Unknown',
      zip: 'Unknown'
    },
    location: {
      latitude: 0,
      longitude: 0
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
    ],
    amenities: ['WiFi', 'Basic amenities', 'Restaurant', '24-hour reception'],
    description: `Hotel ${readableName}`,
    rooms: ratehawkHotel.rates,
    // Mark as fallback data
    is_fallback: true,
    ratehawk_hid: ratehawkHotel.hid,
  };
}

function getMockHotels() {
  return {
    hotels: [
      {
        id: 'hotel_1',
        name: 'Luxury Grand Hotel',
        rating: 4.8,
        stars: 5,
        address: {
          country: 'France',
          city: 'Paris',
          street: '123 Champs-Élysées',
          zip: '75008'
        },
        location: {
          latitude: 48.8566,
          longitude: 2.3522
        },
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
        ],
        amenities: ['WiFi', 'Spa', 'Restaurant', 'Pool', 'Gym'],
        description: 'Luxurious 5-star hotel in the heart of Paris',
        rooms: [
          {
            id: 'room_1',
            name: 'Deluxe King Room',
            type: 'King',
            capacity: { adults: 2, children: 1 },
            price: { amount: 450, currency: 'USD' },
            cancellationPolicy: 'Free cancellation until 24h before check-in',
            boardType: 'Room Only',
            refundable: true,
            available: true
          },
          {
            id: 'room_2',
            name: 'Executive Suite',
            type: 'Suite',
            capacity: { adults: 2, children: 2 },
            price: { amount: 750, currency: 'USD' },
            cancellationPolicy: 'Free cancellation until 24h before check-in',
            boardType: 'Breakfast Included',
            refundable: true,
            available: true
          }
        ]
      },
      {
        id: 'hotel_2',
        name: 'Boutique Hotel de Paris',
        rating: 4.6,
        stars: 4,
        address: {
          country: 'France',
          city: 'Paris',
          street: '456 Rue de Rivoli',
          zip: '75001'
        },
        location: {
          latitude: 48.8606,
          longitude: 2.3376
        },
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
        ],
        amenities: ['WiFi', 'Restaurant', 'Bar', 'Concierge'],
        description: 'Charming boutique hotel with authentic Parisian charm',
        rooms: [
          {
            id: 'room_3',
            name: 'Classic Double Room',
            type: 'Double',
            capacity: { adults: 2, children: 0 },
            price: { amount: 280, currency: 'USD' },
            cancellationPolicy: 'Free cancellation until 48h before check-in',
            boardType: 'Room Only',
            refundable: true,
            available: true
          }
        ]
      }
    ],
    totalResults: 2,
    searchId: 'mock_search_123'
  }
} 