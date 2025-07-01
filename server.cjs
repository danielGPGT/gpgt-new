const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// Load server environment variables first
require('dotenv').config({ path: 'server.env' });

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('Stripe API key not found, Stripe functionality disabled');
}

const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());

// Use a middleware to handle raw body for webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// RateHawk Hotel Search Endpoint
app.post('/api/search-hotels', async (req, res) => {
  try {
    const { destination, checkIn, checkOut, adults, children, rooms, currency, language } = req.body;

    // Validate required parameters
    if (!destination || !checkIn || !checkOut || !adults) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: destination, checkIn, checkOut, adults' 
      });
    }

    // Get RateHawk API credentials from environment
    const apiUrl = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
    const keyId = process.env.ET_API_KEY_ID;
    const apiKey = process.env.ET_API_KEY;

    // Add debug logging
    console.log('🔍 RateHawk API Configuration:');
    console.log('- API URL:', apiUrl);
    console.log('- Key ID:', keyId ? '***' : '(not set)');
    console.log('- API Key:', apiKey ? '***' : '(not set)');

    if (!keyId || !apiKey) {
      console.log('❌ RateHawk API credentials not found, returning mock data');
      return res.json({
        success: true,
        data: getMockHotels()
      });
    }

    // First, search for region by destination name
    console.log('🔍 Searching for region:', destination);
    
    // Use the multicomplete endpoint to find regions
    const regionSearchResponse = await fetch(`${apiUrl}/search/multicomplete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64')
      },
      body: JSON.stringify({
        query: destination,
        language: language || 'en'
      })
    });

    if (!regionSearchResponse.ok) {
      const errorText = await regionSearchResponse.text();
      console.error('❌ Region search failed:', regionSearchResponse.status, errorText);
      return res.json({
        success: true,
        data: getMockHotels()
      });
    }

    const regionData = await regionSearchResponse.json();
    console.log('✅ Region search response:', JSON.stringify(regionData, null, 2));

    // Get the first region ID
    let regionId = null;
    if (regionData.data && regionData.data.regions && regionData.data.regions.length > 0) {
      regionId = regionData.data.regions[0].id;
      console.log('🎯 Using region ID:', regionId);
    } else {
      console.log('⚠️ No regions found, using mock data');
      return res.json({
        success: true,
        data: getMockHotels()
      });
    }

    // Prepare guests array (similar to WordPress implementation)
    const guests = [];
    const adultsPerRoom = Math.ceil(adults / rooms);
    const childrenPerRoom = Math.ceil((children || 0) / rooms);
    let maxAdults = adults;
    let maxChildren = children || 0;

    for (let i = 0; i < rooms; i++) {
      let currentAdults = adultsPerRoom;
      let currentChildren = childrenPerRoom;

      if (maxAdults < adultsPerRoom) {
        currentAdults = maxAdults;
      }
      if (maxChildren < childrenPerRoom) {
        currentChildren = maxChildren;
      }

      maxAdults -= currentAdults;
      maxChildren -= currentChildren;

      const childAges = [];
      if (currentChildren > 0) {
        for (let j = 0; j < currentChildren; j++) {
          childAges.push(14); // Default child age
        }
      }

      guests.push({
        adults: currentAdults,
        children: childAges
      });
    }

    // Prepare the request payload for hotel search
    const searchPayload = {
      region_id: regionId,
      checkin: checkIn,
      checkout: checkOut,
      guests: guests,
      hotels_limit: 20,
      language: language || 'en',
      currency: 'USD'
    };

    console.log('🏨 Searching hotels with payload:', JSON.stringify(searchPayload, null, 2));

    // Make request to RateHawk API using the correct B2B v3 endpoint
    const response = await fetch(`${apiUrl}/search/serp/region/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64')
      },
      body: JSON.stringify(searchPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ RateHawk API error:', response.status, errorText);
      
      // Log rate limit headers if available
      const rateLimitHeaders = {
        'X-RateLimit-SecondsNumber': response.headers.get('X-RateLimit-SecondsNumber'),
        'X-RateLimit-RequestsNumber': response.headers.get('X-RateLimit-RequestsNumber'),
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset')
      };
      console.log('📊 Rate limit headers:', rateLimitHeaders);
      
      // Return mock data if API fails
      return res.json({
        success: true,
        data: getMockHotels()
      });
    }

    const data = await response.json();
    console.log('✅ RateHawk API response received');
    console.log('📄 Raw API response:', JSON.stringify(data, null, 2));

    // Transform RateHawk response to our format
    const transformedData = await transformRateHawkResponse(data, keyId, apiKey);

    res.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('❌ Search hotels error:', error);
    
    // Return mock data for development
    res.json({
      success: true,
      data: getMockHotels()
    });
  }
});

// RateHawk Hotel Details Endpoint
app.post('/api/get-hotel-details', async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, adults, children, rooms, language } = req.body;

    if (!hotelId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing hotelId parameter' 
      });
    }

    // Get RateHawk API credentials from environment
    const apiUrl = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
    const keyId = process.env.ET_API_KEY_ID;
    const apiKey = process.env.ET_API_KEY;

    if (!keyId || !apiKey) {
      console.log('RateHawk API credentials not found, returning mock data');
      const mockHotel = getMockHotels().hotels.find(h => h.id === hotelId);
      if (!mockHotel) {
        return res.status(404).json({ 
          success: false, 
          error: 'Hotel not found' 
        });
      }
      return res.json({
        success: true,
        data: mockHotel
      });
    }

    // Prepare guests array (similar to WordPress implementation)
    const guests = [];
    const adultsPerRoom = Math.ceil(adults / rooms);
    const childrenPerRoom = Math.ceil((children || 0) / rooms);
    let maxAdults = adults;
    let maxChildren = children || 0;

    for (let i = 0; i < rooms; i++) {
      let currentAdults = adultsPerRoom;
      let currentChildren = childrenPerRoom;

      if (maxAdults < adultsPerRoom) {
        currentAdults = maxAdults;
      }
      if (maxChildren < childrenPerRoom) {
        currentChildren = maxChildren;
      }

      maxAdults -= currentAdults;
      maxChildren -= currentChildren;

      const childAges = [];
      if (currentChildren > 0) {
        for (let j = 0; j < currentChildren; j++) {
          childAges.push(14); // Default child age
        }
      }

      guests.push({
        adults: currentAdults,
        children: childAges
      });
    }

    // Get hotel details using the correct endpoint
    const hotelPayload = {
      id: hotelId,
      checkin: checkIn,
      checkout: checkOut,
      guests: guests,
      language: language || 'en'
    };

    console.log('🏨 Getting hotel details with payload:', JSON.stringify(hotelPayload, null, 2));

    const response = await fetch(`${apiUrl}/search/hp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64')
      },
      body: JSON.stringify(hotelPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hotel details API error:', response.status, errorText);
      
      // Return mock data if API fails
      const mockHotel = getMockHotels().hotels.find(h => h.id === hotelId);
      if (!mockHotel) {
        return res.status(404).json({ 
          success: false, 
          error: 'Hotel not found' 
        });
      }
      return res.json({
        success: true,
        data: mockHotel
      });
    }

    const data = await response.json();
    console.log('Hotel details API response:', JSON.stringify(data, null, 2));

    // Transform the response to our format
    const transformedData = transformHotelDetailsResponse(data);

    res.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Get hotel details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel details'
    });
  }
});

// Simple in-memory cache for hotel content (since it's static data)
const hotelContentCache = new Map();

async function getHotelDetailsById(hotelId, keyId, apiKey) {
  try {
    // Check cache first
    if (hotelContentCache.has(hotelId)) {
      console.log(`Using cached hotel content for ${hotelId}`);
      return hotelContentCache.get(hotelId);
    }

    const apiUrl = process.env.ET_API_URL || 'https://api.worldota.net/api/b2b/v3';
    
    // Use the correct hotel content endpoint from ETG API documentation
    const response = await fetch(`${apiUrl}/static/hotels/${hotelId}/content/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64')
      }
    });

    if (!response.ok) {
      throw new Error(`Hotel content API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'ok' || !data.data) {
      throw new Error('Invalid hotel content response');
    }

    // Extract comprehensive hotel information from the response
    const hotel = data.data;
    
    // Extract amenities from amenity_groups
    const allAmenities = hotel.amenity_groups?.flatMap(group => group.amenities) || [];
    
    // Extract description from description_struct
    const description = hotel.description_struct?.map(section => 
      `${section.title}: ${section.paragraphs.join(' ')}`
    ).join('\n\n') || hotel.description || 'Hotel description not available';

    // Extract address components
    const addressParts = hotel.address?.split(', ') || [];
    const city = hotel.region?.name || addressParts[1] || 'Unknown';
    const country = hotel.region?.country_code || addressParts[addressParts.length - 1] || 'Unknown';

    // Process images - replace {size} placeholder with actual size
    const processedImages = (hotel.images || []).map(img => 
      img.replace('{size}', '800x600')
    );

    // Extract star rating - use star_rating if available, otherwise default to 3
    const starRating = hotel.star_rating !== null && hotel.star_rating !== undefined ? hotel.star_rating : 3;

    // Extract SERP filters for additional amenities
    const serpFilters = hotel.serp_filters || [];
    const serpFilterAmenities = serpFilters.map(filter => {
      const filterMap = {
        'has_internet': 'Internet access',
        'has_parking': 'Parking',
        'has_spa': 'Spa',
        'has_pets': 'Pets allowed',
        'has_jacuzzi': 'Jacuzzi',
        'kitchen': 'Kitchen',
        'has_pool': 'Pool',
        'has_gym': 'Gym',
        'has_restaurant': 'Restaurant'
      };
      return filterMap[filter] || filter;
    });

    // Combine amenities from amenity_groups and serp_filters
    const combinedAmenities = [...new Set([...allAmenities, ...serpFilterAmenities])];

    // Extract payment methods
    const paymentMethods = hotel.payment_methods || [];

    // Extract room groups for additional room information
    const roomGroups = hotel.room_groups || [];

    const hotelDetails = {
      id: hotel.id || `hotel_${hotelId}`,
      name: hotel.name || 'Unknown Hotel',
      rating: hotel.rating || hotel.score || 4.0,
      stars: starRating,
      address: {
        country: country,
        city: city,
        street: hotel.address || 'Unknown',
        zip: hotel.postal_code || 'Unknown'
      },
      location: {
        latitude: hotel.latitude || 0,
        longitude: hotel.longitude || 0
      },
      images: processedImages,
      amenities: combinedAmenities,
      description: description,
      phone: hotel.phone,
      email: hotel.email,
      checkInTime: hotel.check_in_time,
      checkOutTime: hotel.check_out_time,
      hotelChain: hotel.hotel_chain,
      kind: hotel.kind,
      isClosed: hotel.is_closed || false,
      starCertificate: hotel.star_certificate,
      paymentMethods: paymentMethods,
      roomGroups: roomGroups,
      serpFilters: serpFilters,
      // Additional metadata
      hid: hotel.hid,
      region: hotel.region,
      facts: hotel.facts,
      keysPickup: hotel.keys_pickup,
      metapolicyExtraInfo: hotel.metapolicy_extra_info,
      policyStruct: hotel.policy_struct
    };

    // Cache the result
    hotelContentCache.set(hotelId, hotelDetails);
    console.log(`Cached hotel content for ${hotelId}`);

    return hotelDetails;
  } catch (error) {
    console.error('Error fetching hotel content:', error);
    throw error;
  }
}

async function transformRateHawkResponse(data, keyId, apiKey) {
  // This function transforms RateHawk's response format to our expected format
  // Based on the actual ETG API response structure
  
  try {
    console.log('Transforming RateHawk response...');
    console.log('Raw data structure:', JSON.stringify(data, null, 2));
    
    // Check if we have the expected data structure
    if (!data || !data.data || !data.data.hotels) {
      console.log('No hotels found in response, returning mock data');
      return getMockHotels();
    }

    const hotels = data.data.hotels;
    console.log(`Found ${hotels.length} hotels in response`);

    const transformedHotels = hotels.map(async (hotel, index) => {
      // Try to get hotel details by hid (numeric hotel ID) if we have one
      let hotelDetails = null;
      if (hotel.hid && keyId && apiKey) {
        try {
          hotelDetails = await getHotelDetailsById(hotel.hid, keyId, apiKey);
        } catch (error) {
          console.log(`Could not fetch details for hotel ${hotel.hid}:`, error.message);
        }
      }

      // Extract hotel basic info from the RateHawk response or hotel details
      const hotelInfo = {
        id: hotel.id || `hotel_${index}`,
        name: hotelDetails?.name || hotel.name || hotel.title || hotel.hotel_name || 
              // Try to extract hotel name from the first rate's room name or other fields
              (hotel.rates && hotel.rates[0] && hotel.rates[0].hotel_name) || 
              (hotel.rates && hotel.rates[0] && hotel.rates[0].hotel?.name) ||
              (hotel.rates && hotel.rates[0] && hotel.rates[0].hotel_info?.name) ||
              // Use the hotel ID as a fallback name (remove underscores and capitalize)
              (hotel.id ? hotel.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Hotel'),
        rating: hotelDetails?.rating || hotel.rating || hotel.score || 4.0,
        stars: hotelDetails?.stars || hotel.stars || hotel.star_rating || 3,
        address: {
          country: hotelDetails?.address?.country || hotel.country || hotel.location?.country || 'Unknown',
          city: hotelDetails?.address?.city || hotel.city || hotel.location?.city || 'Unknown',
          street: hotelDetails?.address?.street || hotel.address || hotel.location?.address || 'Unknown',
          zip: hotelDetails?.address?.zip || hotel.zip || hotel.location?.zip || 'Unknown'
        },
        location: {
          latitude: hotelDetails?.location?.latitude || hotel.latitude || hotel.location?.lat || 0,
          longitude: hotelDetails?.location?.longitude || hotel.longitude || hotel.location?.lng || 0
        },
        images: hotelDetails?.images || hotel.images || hotel.photos || [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ],
        amenities: hotelDetails?.amenities || hotel.amenities || hotel.facilities || ['WiFi', 'Restaurant'],
        description: hotelDetails?.description || hotel.description || hotel.info || 'Hotel description not available',
      };

      // Transform the rates into rooms
      const rooms = (hotel.rates || []).map((rate, rateIndex) => {
        // Extract price information from payment_options
        const paymentOption = rate.payment_options?.payment_types?.[0];
        const priceAmount = paymentOption ? parseFloat(paymentOption.show_amount) : 200;
        const priceCurrency = paymentOption?.show_currency_code || 'USD';
        
        // Extract capacity from rg_ext
        const capacity = rate.rg_ext?.capacity || 2;
        
        // Extract meal type
        const mealType = rate.meal_data?.value || 'nomeal';
        const boardType = mealType === 'breakfast' ? 'Breakfast Included' : 
                         mealType === 'halfboard' ? 'Half Board' :
                         mealType === 'fullboard' ? 'Full Board' : 'Room Only';
        
        // Extract cancellation policy
        const cancellationPolicy = paymentOption?.cancellation_penalties?.free_cancellation_before ? 
          `Free cancellation until ${new Date(paymentOption.cancellation_penalties.free_cancellation_before).toLocaleDateString()}` :
          'Cancellation policy varies';

        return {
          id: rate.match_hash || `room_${index}_${rateIndex}`,
          name: rate.room_name || rate.room_data_trans?.main_room_type || 'Standard Room',
          type: rate.room_data_trans?.main_room_type || 'Standard',
          capacity: { 
            adults: capacity, 
            children: 0 
          },
          price: { 
            amount: priceAmount, 
            currency: priceCurrency
          },
          cancellationPolicy: cancellationPolicy,
          boardType: boardType,
          refundable: true, // Most rates are refundable
          available: true
        };
      });

      // If no rates found, create a default room
      if (rooms.length === 0) {
        rooms.push({
          id: `room_${index}_1`,
          name: 'Standard Room',
          type: 'Standard',
          capacity: { adults: 2, children: 0 },
          price: { 
            amount: 200, 
            currency: 'USD' 
          },
          cancellationPolicy: 'Free cancellation until 24h before check-in',
          boardType: 'Room Only',
          refundable: true,
          available: true
        });
      }

      return {
        ...hotelInfo,
        rooms: rooms
      };
    });

    // Wait for all hotel transformations to complete
    const resolvedHotels = await Promise.all(transformedHotels);

    return {
      hotels: resolvedHotels,
      totalResults: hotels.length,
      searchId: data.search_id || `search_${Date.now()}`
    };

  } catch (error) {
    console.error('Error transforming RateHawk response:', error);
    return getMockHotels();
  }
}

function transformHotelDetailsResponse(data) {
  // This function transforms the hotel details response to our expected format
  // You'll need to adjust this based on the actual RateHawk API response structure
  
  try {
    // For now, return mock data while we figure out the exact RateHawk response format
    return getMockHotels();
  } catch (error) {
    console.error('Error transforming hotel details response:', error);
    return getMockHotels();
  }
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
  };
}

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return res.status(400).json({ 
        success: false, 
        error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in your environment.' 
      });
    }

    const { priceId, customerEmail, userId, planType, seatCount, signupData, successUrl, cancelUrl } = req.body;
    // Handle Free plan: no Stripe session needed
    if (planType === 'free') {
      // ... existing code to update DB ...
      return res.json({ success: true, message: 'Free plan activated.' });
    }
    // Handle Enterprise plan: do not allow self-serve checkout
    if (planType === 'enterprise') {
      return res.status(400).json({ success: false, error: 'Enterprise plans are custom. Please contact sales.' });
    }
    // Handle Agency plan seat count
    let finalPriceId = priceId;
    let quantity = 1;
    if (planType === 'agency') {
      const seats = Math.max(1, Math.min(10, parseInt(seatCount) || 1));
      quantity = seats;
    }
    let sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan_type: planType,
      },
      allow_promotion_codes: true,
    };

    // Handle new signup (no userId) vs existing user
    if (!userId && signupData) {
      // New signup - store signup data in metadata for account creation after payment
      console.log('🆕 Creating checkout session for new signup');
      sessionConfig.metadata.signup_email = signupData.email;
      sessionConfig.metadata.signup_password = signupData.password;
      sessionConfig.metadata.signup_name = signupData.name;
      sessionConfig.metadata.signup_phone = signupData.phone || null;
      sessionConfig.metadata.signup_agency_name = signupData.agency_name || null;
      sessionConfig.metadata.signup_logo_url = signupData.logo_url || null;
      sessionConfig.metadata.needs_account_creation = 'true';
      sessionConfig.customer_email = customerEmail;
    } else if (userId) {
      // Existing user - check for existing subscription
      console.log('👤 Creating checkout session for existing user:', userId);
      sessionConfig.metadata.user_id = userId;
      
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id, status')
        .eq('user_id', userId)
        .single();

      // If user has an existing customer ID, use it
      if (existingSubscription?.stripe_customer_id) {
        console.log(`Using existing customer ID: ${existingSubscription.stripe_customer_id}`);
        sessionConfig.customer = existingSubscription.stripe_customer_id;
        
        // Update customer metadata to ensure user_id is available for webhooks
        try {
          await stripe.customers.update(existingSubscription.stripe_customer_id, {
            metadata: {
              user_id: userId,
            }
          });
          console.log(`Updated customer metadata with user_id: ${userId}`);
        } catch (error) {
          console.error('Error updating customer metadata:', error);
        }
      } else {
        // For existing users without customer ID, use customer_email
        sessionConfig.customer_email = customerEmail;
      }

      // If user is currently on a trial, we need to handle the transition
      if (existingSubscription?.status === 'trialing') {
        console.log(`User ${userId} is converting from trial to paid subscription`);
        
        // Add metadata to indicate this is a trial conversion
        sessionConfig.metadata.trial_conversion = 'true';
        sessionConfig.metadata.original_trial_end = existingSubscription.current_period_end;
      }
    } else {
      return res.status(400).json({ success: false, error: 'Either userId or signupData is required' });
    }

    // Configure trial period only for starter plan
    if (planType === 'starter') {
      console.log('Creating starter plan subscription with trial period');
      // Set trial period at the subscription level
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        metadata: {
          plan_type: planType,
          trial_plan: 'true'
        }
      };
    } else {
      console.log(`Creating ${planType} plan subscription - immediate billing`);
      // Professional and Enterprise plans start billing immediately
      // No trial period configured
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook endpoint
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // Check if Stripe is initialized
  if (!stripe) {
    console.log('⚠️ Stripe not initialized, skipping webhook processing');
    return res.status(200).json({ received: true, message: 'Stripe not configured' });
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Raw webhook request received');
  console.log('Headers:', req.headers);
  console.log('Body length:', req.body.length);
  console.log('🔐 Attempting to verify webhook signature...');

  try {
    console.log('📨 Webhook received:', event.type);
    console.log('Event ID:', event.id);
    console.log('Event data:', JSON.stringify(event.data, null, 2));

    // 1. Log the event
    console.log('🔔 Stripe event:', event.type, event.id);

    // 2. Idempotency: Check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single();
    if (existingEvent) {
      console.log('⚠️ Event already processed:', event.id);
      return res.status(200).json({ received: true });
    }

    // 3. Process the event (user/team/subscription creation logic)
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔄 Processing checkout.session.completed event...');
        const session = event.data.object;
        
        // Check if this is a new signup that needs account creation
        if (session.metadata?.needs_account_creation === 'true') {
          console.log('🆕 New signup detected - creating user account');
          try {
            // First check if user already exists by email
            const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
            const userExists = existingUser?.users?.find(u => u.email === session.metadata.signup_email);
            let newUserId;
            if (userExists) {
              console.log('✅ User already exists:', userExists.id);
              newUserId = userExists.id;
            } else {
              // Create the user account in Supabase Auth
              const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: session.metadata.signup_email,
                password: session.metadata.signup_password,
                email_confirm: true, // Auto-confirm email since payment is complete
                user_metadata: {
                  name: session.metadata.signup_name,
                  phone: session.metadata.signup_phone || null,
                  agency_name: session.metadata.signup_agency_name || null,
                  logo_url: session.metadata.signup_logo_url || null
                }
              });
              if (authError) {
                console.error('❌ Error creating user account:', authError);
                break;
              }
              newUserId = authData.user.id;
              console.log('✅ User account created:', newUserId);
            }
            // Check required fields
            if (!newUserId || !session.metadata.signup_email || !session.metadata.signup_name) {
              console.error('❌ Missing required fields for user upsert:', {
                newUserId,
                signup_email: session.metadata.signup_email,
                signup_name: session.metadata.signup_name,
                signup_phone: session.metadata.signup_phone,
                signup_agency_name: session.metadata.signup_agency_name,
                signup_logo_url: session.metadata.signup_logo_url
              });
              break;
            }
            // Log the data to be upserted
            const userUpsertData = {
              id: newUserId,
              email: session.metadata.signup_email,
              name: session.metadata.signup_name,
              phone: session.metadata.signup_phone || null,
              agency_name: session.metadata.signup_agency_name || null,
              logo_url: session.metadata.signup_logo_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            console.log('ℹ️ Upserting user with data:', userUpsertData);
            // Log service role key status
            console.log('ℹ️ Using Supabase service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO');
            // Create user profile (use upsert to handle duplicates)
            const { error: profileError } = await supabase
              .from('users')
              .upsert(userUpsertData, { onConflict: 'id' });
            if (profileError) {
              console.error('❌ Error creating user profile:', profileError, 'Data:', userUpsertData);
            } else {
              console.log('✅ User profile created/updated');
            }

            // Create subscription record (use upsert to handle duplicates)
            const isStarterPlan = session.metadata.plan_type === 'starter';
            const subscriptionStatus = isStarterPlan ? 'trialing' : 'active';
            const periodEnd = isStarterPlan 
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for trial
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days for paid plans

            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: newUserId,
                plan_type: session.metadata.plan_type,
                status: subscriptionStatus,
                current_period_start: new Date().toISOString(),
                current_period_end: periodEnd,
                cancel_at_period_end: false,
                stripe_subscription_id: null,
                stripe_customer_id: null
              }, {
                onConflict: 'user_id'
              });

            if (subscriptionError) {
              console.error('❌ Error creating subscription record:', subscriptionError);
            } else {
              console.log('✅ Subscription record created/updated');
            }

            // Update the session metadata with the new user ID for future webhook processing
            if (stripe) {
              await stripe.checkout.sessions.update(session.id, {
                metadata: {
                  ...session.metadata,
                  user_id: newUserId,
                  needs_account_creation: 'false'
                }
              });
              console.log('✅ Session metadata updated with new user ID');
            } else {
              console.log('⚠️ Stripe not initialized, skipping session metadata update');
            }

            // Find the team for the user
            const { data: team, error: teamError } = await supabase
              .from('teams')
              .select('id')
              .eq('owner_id', newUserId)
              .single();
            // Find the subscription (if session.subscription exists)
            let subscriptionRecord = null;
            if (session.subscription) {
              const { data: subRecord, error: subFetchError } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('id', session.subscription)
                .single();
              if (subRecord && subRecord.id) {
                subscriptionRecord = subRecord;
              } else {
                console.error('❌ Could not find subscription to update with team_id:', subFetchError);
              }
            }
            if (team && team.id && subscriptionRecord && subscriptionRecord.id) {
              // Link subscription to team
              const { error: subUpdateError } = await supabase
                .from('subscriptions')
                .update({ team_id: team.id })
                .eq('id', subscriptionRecord.id);
              if (!subUpdateError) {
                console.log('✅ Subscription team_id updated:', subscriptionRecord.id, team.id);
              } else {
                console.error('❌ Error updating subscription with team_id:', subUpdateError);
              }
              // Link team to subscription
              const { error: teamUpdateError } = await supabase
                .from('teams')
                .update({ subscription_id: subscriptionRecord.id })
                .eq('id', team.id);
              if (!teamUpdateError) {
                console.log('✅ Team subscription_id updated:', team.id, subscriptionRecord.id);
              } else {
                console.error('❌ Error updating team with subscription_id:', teamUpdateError);
              }
            } else {
              if (!team || !team.id) {
                console.warn('⚠️ No team found for user after signup:', newUserId);
              }
              if (!subscriptionRecord || !subscriptionRecord.id) {
                console.warn('⚠️ No subscription found to link to team:', session.subscription);
              }
            }
          } catch (error) {
            console.error('❌ Error in account creation process:', error);
            break;
          }
        }

        // Extract user ID from metadata (check both possible keys)
        const userId = session.metadata?.user_id || session.metadata?.userId;
        if (!userId) {
          console.error('❌ No user ID found in session metadata');
          console.error('Available metadata:', session.metadata);
          break;
        }

        console.log('🔄 Processing checkout session for user:', userId);
        console.log('Session ID:', session.id);
        console.log('Subscription ID:', session.subscription);

        // If this is a trial subscription, update the database
        if (session.subscription && stripe) {
          try {
            // Get the subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            console.log('📋 Stripe subscription details:', {
              id: subscription.id,
              status: subscription.status,
              trial_start: subscription.trial_start,
              trial_end: subscription.trial_end,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end
            });

            // Update the database subscription with Stripe details
            const { data: updatedSub, error: updateError } = await supabase
              .from('subscriptions')
              .update({
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
              })
              .eq('user_id', userId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Error updating subscription:', updateError);
            } else {
              console.log('✅ Successfully linked Stripe subscription to database:', updatedSub);
            }
          } catch (stripeError) {
            console.error('❌ Error retrieving Stripe subscription:', stripeError);
          }
        }

        break;

      case 'customer.subscription.created':
        console.log('🔄 Processing customer.subscription.created event...');
        const newSubscription = event.data.object;
        
        // Find the user by customer ID
        const { data: userByCustomer, error: customerError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', newSubscription.customer)
          .single();

        if (customerError) {
          console.error('❌ Error finding user by customer ID:', customerError);
          
          // If no user found by customer ID, try to find by subscription ID in metadata
          // This might happen if the checkout session was processed first
          if (stripe) {
            try {
              const { data: sessions } = await stripe.checkout.sessions.list({
                subscription: newSubscription.id,
                limit: 1
              });
              
              if (sessions && sessions.data && sessions.data.length > 0) {
                const session = sessions.data[0];
                const userId = session.metadata?.user_id || session.metadata?.userId;
                
                if (userId) {
                  console.log('🔄 Found user ID from session metadata:', userId);
                  
                  // Update the subscription with Stripe details
                  const { data: updatedSub, error: updateError } = await supabase
                    .from('subscriptions')
                    .update({
                      stripe_subscription_id: newSubscription.id,
                      stripe_customer_id: newSubscription.customer,
                      status: newSubscription.status,
                      current_period_start: new Date(newSubscription.current_period_start * 1000).toISOString(),
                      current_period_end: new Date(newSubscription.current_period_end * 1000).toISOString(),
                      cancel_at_period_end: newSubscription.cancel_at_period_end
                    })
                    .eq('user_id', userId)
                    .select()
                    .single();

                  if (updateError) {
                    console.error('❌ Error updating subscription:', updateError);
                  } else {
                    console.log('✅ Successfully updated subscription:', updatedSub);
                  }
                }
              } else {
                console.log('ℹ️ No checkout session found for subscription:', newSubscription.id);
              }
            } catch (stripeError) {
              console.error('❌ Error finding session by subscription ID:', stripeError);
            }
          }
          break;
        }

        if (userByCustomer) {
          console.log('🔄 Updating subscription for user:', userByCustomer.user_id);
          
          const { data: updatedSub, error: updateError } = await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: newSubscription.id,
              status: newSubscription.status,
              current_period_start: new Date(newSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(newSubscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: newSubscription.cancel_at_period_end
            })
            .eq('user_id', userByCustomer.user_id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating subscription:', updateError);
          } else {
            console.log('✅ Successfully updated subscription:', updatedSub);
          }
        }

        // After updating the subscriptions table, also update the teams table
        const { data: teamByCustomer, error: teamByCustomerError } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', userByCustomer.user_id)
          .single();
        if (teamByCustomer && teamByCustomer.id) {
          await supabase
            .from('teams')
            .update({ subscription_id: newSubscription.id })
            .eq('id', teamByCustomer.id);
          console.log('✅ Team subscription_id updated:', teamByCustomer.id, newSubscription.id);
        }
        break;

      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated event...');
        const updatedSubscription = event.data.object;
        
        // Find the user by subscription ID
        const { data: userBySub, error: subError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', updatedSubscription.id)
          .single();

        if (subError) {
          console.error('❌ Error finding user by subscription ID:', subError);
          break;
        }

        if (userBySub) {
          console.log('🔄 Updating subscription for user:', userBySub.user_id);
          
          const { data: updatedSub, error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: updatedSubscription.status,
              current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: updatedSubscription.cancel_at_period_end
            })
            .eq('user_id', userBySub.user_id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating subscription:', updateError);
          } else {
            console.log('✅ Successfully updated subscription:', updatedSub);
          }
        }

        // After updating the subscriptions table, also update the teams table
        const { data: teamBySub, error: teamBySubError } = await supabase
          .from('teams')
          .select('id')
          .eq('owner_id', userBySub.user_id)
          .single();
        if (teamBySub && teamBySub.id) {
          await supabase
            .from('teams')
            .update({ subscription_id: updatedSubscription.id })
            .eq('id', teamBySub.id);
          console.log('✅ Team subscription_id updated:', teamBySub.id, updatedSubscription.id);
        }
        break;

      default:
        console.log('⚠️ Unhandled event type:', event.type);
    }

    // 4. Record the event as processed
    await supabase.from('stripe_events').insert({ event_id: event.id, type: event.type });

    // 5. Log success
    console.log('✅ Webhook processed successfully:', event.type);

    return res.status(200).json({ received: true });
  } catch (error) {
    // 6. Log and notify on error
    console.error('❌ Error processing webhook:', error);
    // Optionally: send an email/Slack alert here
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get checkout session details
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    console.log(`Retrieving checkout session: ${sessionId}`);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription'],
    });
    
    console.log('Session retrieved:', {
      id: session.id,
      customer_email: session.customer_details?.email,
      subscription_id: session.subscription?.id,
      amount_total: session.amount_total,
      currency: session.currency
    });

    // Get plan type from metadata or subscription
    let planType = 'Unknown Plan';
    if (session.metadata?.plan_type) {
      planType = session.metadata.plan_type;
    } else if (session.subscription?.items?.data?.[0]?.price?.nickname) {
      planType = session.subscription.items.data[0].price.nickname;
    } else if (session.subscription?.items?.data?.[0]?.price?.id) {
      // Fallback: determine plan from price ID
      const priceId = session.subscription.items.data[0].price.id;
      if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
        planType = 'Professional';
      } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
        planType = 'Enterprise';
      } else {
        planType = 'Starter';
      }
    }
    
    // We only want to expose the necessary information to the client
    res.json({
      success: true,
      customer_email: session.customer_details?.email || session.customer?.email || 'Unknown',
      plan_type: planType,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'usd',
      subscription_status: session.subscription?.status || 'unknown',
    });

  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a subscription
app.post('/api/update-subscription', async (req, res) => {
  try {
    const { subscriptionId, newPriceId } = req.body;
    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ success: false, error: 'Subscription ID and New Price ID are required.' });
    }

    console.log(`🔍 Updating subscription ${subscriptionId} to price ${newPriceId}`);

    // Retrieve the subscription to find the subscription item ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0].id;

    console.log(`✅ Stripe subscription found: ${subscription.id}, customer: ${subscription.customer}`);

    // Determine the new plan type from the price ID
    let newPlanType = 'starter';
    if (newPriceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
      newPlanType = 'professional';
    } else if (newPriceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
      newPlanType = 'enterprise';
    }

    console.log(`📋 Plan type determined: ${newPlanType}`);

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate the changes
      metadata: {
        planType: newPlanType, // Add plan type to metadata for webhook
      }
    });

    console.log(`✅ Stripe subscription updated successfully: ${updatedSubscription.id}`);

    // Manually update the database since webhook might not fire immediately
    console.log(`🔍 Attempting to update database for subscription ${subscriptionId}...`);
    
    try {
      // First, check if the subscription exists in the database
      console.log(`🔍 Looking for subscription with stripe_subscription_id: ${subscriptionId}`);
      
      const { data: existingSub, error: checkError } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan_type, stripe_subscription_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (checkError) {
        console.error('❌ Error checking existing subscription:', checkError);
        console.error('🔍 This might mean the subscription ID is not found in the database');
        
        // Let's also check what subscriptions exist in the database
        const { data: allSubs, error: listError } = await supabase
          .from('subscriptions')
          .select('id, user_id, plan_type, stripe_subscription_id')
          .limit(10);
        
        if (listError) {
          console.error('❌ Error listing subscriptions:', listError);
        } else {
          console.log('📋 Available subscriptions in database:', allSubs);
        }
        
        return res.status(404).json({ 
          success: false, 
          error: 'Subscription not found in database',
          stripeSuccess: true,
          databaseError: checkError.message,
          searchedFor: subscriptionId,
          availableSubscriptions: allSubs || []
        });
      }

      console.log(`✅ Found existing subscription in database:`, {
        id: existingSub.id,
        user_id: existingSub.user_id,
        current_plan: existingSub.plan_type,
        new_plan: newPlanType,
        stripe_subscription_id: existingSub.stripe_subscription_id
      });

      // Now attempt the update using user_id (which is unique)
      const { data: updateData, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_type: newPlanType,
          status: updatedSubscription.status,
          current_period_start: safeStripeTimestamp(updatedSubscription.current_period_start),
          current_period_end: safeStripeTimestamp(updatedSubscription.current_period_end),
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', existingSub.user_id) // Use user_id since it's unique
        .select(); // Add select to see what was updated

      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        console.error('Error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        
        // Return error to client so they know the database update failed
        return res.status(500).json({ 
          success: false, 
          error: 'Stripe updated but database sync failed',
          stripeSuccess: true,
          databaseError: updateError.message
        });
      } else {
        console.log(`✅ Database updated successfully for subscription ${subscriptionId}`);
        console.log('📋 Updated data:', updateData);
      }
    } catch (dbError) {
      console.error('❌ Database update exception:', dbError);
      console.error('Exception details:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      
      // Return error to client
      return res.status(500).json({ 
        success: false, 
        error: 'Database update failed',
        stripeSuccess: true,
        databaseError: dbError.message
      });
    }

    // After updating the subscriptions table, also update the teams table
    const { data: teamByExistingSub, error: teamByExistingSubError } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_id', existingSub.user_id)
        .single();
    if (teamByExistingSub && teamByExistingSub.id) {
      await supabase
        .from('teams')
        .update({ subscription_id: updatedSubscription.id })
        .eq('id', teamByExistingSub.id);
      console.log('✅ Team subscription_id updated:', teamByExistingSub.id, updatedSubscription.id);
    }

    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send team invitation email via Resend
app.post('/api/send-team-invitation', async (req, res) => {
  const { email, inviteLink, inviterName, teamName } = req.body;
  try {
    if (!email || !inviteLink || !inviterName || !teamName) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@aitinerary.com',
        to: email,
        subject: `You're invited to join ${teamName} on AItinerary`,
        html: `
          <h2>Team Invitation</h2>
          <p>${inviterName} has invited you to join their team on AItinerary.</p>
          <a href="${inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
          <p>This invitation will expire soon.</p>
        `
      })
    });
    if (!response.ok) throw new Error('Failed to send email');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept team invitation endpoint
app.post('/api/team/accept-invite', async (req, res) => {
  const { token, user_id, name } = req.body;
  if (!token || !user_id) {
    return res.status(400).json({ success: false, error: 'Missing token or user_id' });
  }
  try {
    // 1. Find the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    if (inviteError || !invite) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Invitation is not pending' });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invitation has expired' });
    }
    // 2. Add user to team_members (if not already a member)
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invite.team_id)
      .eq('user_id', user_id)
        .single();
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'User is already a team member' });
    }
    const { error: addError } = await supabase
      .from('team_members')
      .insert({
        team_id: invite.team_id,
        user_id,
        email: invite.email,
        name: name || null,
        role: invite.role,
        status: 'active',
        invited_by: invite.invited_by,
        invited_at: invite.created_at,
        joined_at: new Date().toISOString(),
      });
    if (addError) {
      return res.status(500).json({ success: false, error: 'Failed to add user to team: ' + addError.message });
    }
    // 3. Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (updateError) {
      return res.status(500).json({ success: false, error: 'Failed to update invitation: ' + updateError.message });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Helper to send team invitation email (console log for local dev)
// NOTE: In production, replace this with actual email sending (e.g., Resend, Mailgun, etc)
async function sendTeamInvitationEmail({ email, inviteLink, inviterName, teamName }) {
  console.log('[DEV] Simulated invite email:', {
    to: email,
    subject: `You\'re invited to join ${teamName} on AItinerary`,
    inviteLink,
    inviterName,
    teamName
  });
  // No actual email sent in local development!
}

// Create and send a team invitation
app.post('/api/team/invite', async (req, res) => {
  const { team_id, email, role, inviter_id, inviter_name, team_name } = req.body;
  if (!team_id || !email || !role || !inviter_id || !inviter_name || !team_name) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }
  try {
    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', team_id)
      .eq('email', email)
      .eq('status', 'pending')
          .single();
    if (existingInvite) {
      return res.status(400).json({ success: false, error: 'Invitation already sent to this email.' });
    }
    // Generate token and expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    // Insert invitation
    const { data: invite, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        team_id,
        email,
        role,
        invited_by: inviter_id,
        token,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single();
    if (inviteError || !invite) {
      return res.status(500).json({ success: false, error: 'Failed to create invitation.' });
    }
    // Construct invite link
    const inviteLink = `${process.env.APP_BASE_URL || 'https://your-app.com'}/team-invitation-signup?token=${token}`;
    // Send email
    await sendTeamInvitationEmail({
      email,
      inviteLink,
      inviterName: inviter_name,
      teamName: team_name
    });
    return res.json({ success: true, invitation: invite, inviteLink });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get team invitation and team info for signup page
app.get('/api/team-invitation-info', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing token' });
  }
  try {
    // Find the invitation
    const { data: invite, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    if (inviteError || !invite) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    // Find the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, logo_url')
      .eq('id', invite.team_id)
      .single();
    if (teamError || !team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    return res.json({ success: true, invite, team });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/webhook`);
});