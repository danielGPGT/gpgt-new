// RateHawk API Types
export interface RateHawkHotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  language?: string;
}

export interface RateHawkRoomGroup {
  room_group_id: number;
  name: string;
  images: string[];
  images_ext?: Array<{
    category_slug: string;
    url: string;
  }>;
  room_amenities: string[];
  name_struct: {
    bathroom: string;
    bedding_type: string | null;
    main_name: string;
  };
  rg_ext: {
    balcony: number;
    bathroom: number;
    bedding: number;
    bedrooms: number;
    capacity: number;
    class: number;
    club: number;
    family: number;
    floor: number;
    quality: number;
    sex: number;
    view: number;
  };
}

export interface RateHawkHotel {
  id: string;
  name: string;
  rating: number;
  stars: number;
  address: {
    country: string;
    city: string;
    street: string;
    zip: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  amenities: string[];
  description?: string;
  phone?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  hotelChain?: string;
  kind?: string;
  isClosed?: boolean;
  starCertificate?: any;
  paymentMethods?: string[];
  roomGroups?: RateHawkRoomGroup[];
  serpFilters?: string[];
  hid?: number;
  ratehawk_id?: string;
  is_fallback?: boolean;
  region?: {
    country_code: string;
    iata: string;
    id: number;
    name: string;
    type: string;
  };
  facts?: any;
  keysPickup?: any;
  metapolicyExtraInfo?: string;
  policyStruct?: any[];
}

export interface RateHawkRoom {
  id: string;
  name: string;
  type: string;
  capacity: {
    adults: number;
    children: number;
  };
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  cancellationPolicy?: string;
  boardType?: string;
  refundable: boolean;
  available: boolean;
  roomGroupId?: number; // Reference to room group for images
  images?: string[]; // Room-specific images from room group
  description?: string; // Room description
  amenities?: string[]; // Room amenities from room group
}

export interface RateHawkHotelWithRooms extends RateHawkHotel {
  rooms: RateHawkRoom[];
}

export interface RateHawkSearchResponse {
  hotels: RateHawkHotelWithRooms[];
  totalResults: number;
  searchId: string;
}

export interface RateHawkError {
  code: string;
  message: string;
}

class RateHawkService {
  private baseUrl: string;

  constructor() {
    // Use Supabase Edge Function with HID matching
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
  }

  /**
   * Search for hotels using RateHawk API via Supabase Edge Function with HID matching
   */
  async searchHotels(params: RateHawkHotelSearchParams): Promise<RateHawkSearchResponse> {
    console.log('🔍 RateHawkService.searchHotels called with params:', params);
    
    try {
      // Use Supabase Edge Function endpoint
      const url = `${this.baseUrl}/search-hotels`;
      console.log('📤 Making POST request to Supabase Edge Function:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(params),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Edge Function error:', errorData);
        throw new Error(`Edge Function error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📋 Raw Edge Function response:', result);
      
      // The Edge Function returns the data directly, no need for success wrapper
      console.log('✅ Edge Function response successful, returning hotel data...');

      // Transform the response to match our expected format
      const transformedResponse: RateHawkSearchResponse = {
        hotels: result.hotels.map((hotel: any) => {
          // Process images properly - replace {size} placeholders
          const processedImages = (hotel.images || []).map((img: string) => {
            if (typeof img === 'string' && img.includes('{size}')) {
              return img.replace('{size}', '240x240'); // Use 240x240 which is commonly used
            }
            return img;
          });

          // Process room groups if available
          const processedRoomGroups = (hotel.roomGroups || []).map((group: any) => ({
            room_group_id: group.room_group_id,
            name: group.name,
            images: (group.images || []).map((img: string) => {
              if (typeof img === 'string' && img.includes('{size}')) {
                return img.replace('{size}', '240x240'); // Use consistent size
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

          console.log(`🏨 Processing hotel: ${hotel.name} (${hotel.hid})`);
          console.log(`📸 Hotel has ${processedImages.length} images`);
          console.log(`🛏️ Hotel has ${processedRoomGroups.length} room groups:`, processedRoomGroups.map(rg => ({
            name: rg.name,
            images: rg.images?.length || 0,
            amenities: rg.room_amenities?.length || 0
          })));

          // Transform rooms and match with room groups
          const transformedRooms = (hotel.rooms || hotel.rates || []).map((room: any) => {
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

            // Process room images - replace {size} placeholders
            const processedRoomImages = (matchingRoomGroup?.images || []).map((img: string) => {
              if (typeof img === 'string' && img.includes('{size}')) {
                return img.replace('{size}', '240x240'); // Use larger size for room images
              }
              return img;
            });

            // Fallback to hotel images if no room images
            const finalImages = processedRoomImages.length > 0 ? processedRoomImages : processedImages;

            console.log(`🔍 Room "${room.name}" matched with group:`, matchingRoomGroup?.name, 'Images:', finalImages.length, 'Room group images:', processedRoomImages.length);
            if (matchingRoomGroup?.images) {
              console.log(`🖼️ Room group images for "${room.name}":`, matchingRoomGroup.images);
            }

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
              images: finalImages,
              amenities: matchingRoomGroup?.room_amenities || [],
              description: room.description || matchingRoomGroup?.name || 'Comfortable room with modern amenities'
            };
          });

          return {
            id: hotel.id,
            name: hotel.name,
            rating: hotel.rating || 4.0,
            stars: hotel.stars || hotel.star_rating || 3,
            address: {
              country: hotel.country || hotel.address?.country || 'Unknown',
              city: hotel.city || hotel.address?.city || 'Unknown',
              street: hotel.address?.street || 'Unknown',
              zip: hotel.address?.zip || 'Unknown'
            },
            location: {
              latitude: hotel.latitude || hotel.location?.latitude || 0,
              longitude: hotel.longitude || hotel.location?.longitude || 0
            },
            images: processedImages.length > 0 ? processedImages : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
            amenities: hotel.amenities || ['WiFi', 'Basic amenities'],
            description: hotel.description || `Hotel ${hotel.name}`,
            phone: hotel.phone,
            email: hotel.email,
            checkInTime: hotel.check_in_time,
            checkOutTime: hotel.check_out_time,
            hotelChain: hotel.hotel_chain,
            kind: hotel.kind,
            isClosed: hotel.is_closed || false,
            hid: hotel.hid || hotel.ratehawk_hid,
            ratehawk_id: hotel.ratehawk_id,
            is_fallback: hotel.is_fallback || false,
            roomGroups: processedRoomGroups,
            rooms: transformedRooms
          };
        }),
        totalResults: result.hotels?.length || 0,
        searchId: `search_${Date.now()}`
      };

      console.log('✅ Transformed response:', transformedResponse);
      return transformedResponse;
    } catch (error) {
      console.error('❌ RateHawk search error:', error);
      // Fall back to mock data if API fails
      console.log('🔄 Falling back to mock data...');
      return this.getMockHotels();
    }
  }

  /**
   * Get hotel details by ID via Express server
   */
  async getHotelDetails(hotelId: string, searchParams: RateHawkHotelSearchParams): Promise<RateHawkHotelWithRooms> {
    try {
      const response = await fetch(`${this.baseUrl}/get-hotel-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          ...searchParams
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get hotel details');
      }

      return result.data;
    } catch (error) {
      console.error('RateHawk hotel details error:', error);
      // Fall back to mock data if API fails
      const mockHotels = this.getMockHotels();
      const mockHotel = mockHotels.hotels.find(h => h.id === hotelId);
      if (!mockHotel) {
        throw new Error('Hotel not found');
      }
      return mockHotel;
    }
  }

  /**
   * Mock data for development/testing when API is not available
   */
  getMockHotels(): RateHawkSearchResponse {
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
          amenities: ['WiFi', 'Spa', 'Restaurant', 'Pool', 'Gym', '24-hour reception'],
          description: 'Luxurious 5-star hotel in the heart of Paris',
          phone: '+33 1 42 65 12 34',
          email: 'reservations@luxurygrandhotel.com',
          checkInTime: '15:00:00',
          checkOutTime: '12:00:00',
          hotelChain: 'Luxury Collection',
          kind: 'Hotel',
          isClosed: false,
          paymentMethods: ['visa', 'mastercard', 'amex', 'cash'],
          serpFilters: ['has_internet', 'has_parking', 'has_spa', 'has_pool'],
          hid: 12345,
          region: {
            country_code: 'FR',
            iata: 'CDG',
            id: 1234,
            name: 'Paris',
            type: 'City'
          },
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
          amenities: ['WiFi', 'Restaurant', 'Bar', 'Concierge', 'Early check-in'],
          description: 'Charming boutique hotel with authentic Parisian charm',
          phone: '+33 1 42 97 48 51',
          email: 'info@boutiquehoteldeparis.com',
          checkInTime: '14:00:00',
          checkOutTime: '11:00:00',
          hotelChain: 'Independent',
          kind: 'Hotel',
          isClosed: false,
          paymentMethods: ['visa', 'mastercard', 'cash'],
          serpFilters: ['has_internet', 'has_restaurant', 'kitchen'],
          hid: 67890,
          region: {
            country_code: 'FR',
            iata: 'CDG',
            id: 1234,
            name: 'Paris',
            type: 'City'
          },
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
}

export const rateHawkService = new RateHawkService(); 