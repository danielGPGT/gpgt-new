import { mockRateHawkHotels, getBestRate, calculateTotalPrice, getRoomAmenities } from '../mockData/mockHotelData';

export interface HotelSearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  maxPrice?: number;
  minRating?: number;
}

export interface HotelSearchResult {
  hotels: any[];
  total: number;
  searchParams: HotelSearchParams;
}

export const mockHotelService = {
  async searchHotels(params: HotelSearchParams = {}): Promise<HotelSearchResult> {
    console.log('Mock hotel service searching with params:', params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get hotels from RateHawk mock data
    const rateHawkHotels = mockRateHawkHotels.data.hotels;
    
    // Convert RateHawk format to our internal format for compatibility
    const convertedHotels = rateHawkHotels.map(hotel => {
      // Get the best rate for this hotel based on search criteria
      const bestRate = getBestRate(hotel, {
        maxPrice: params.maxPrice,
        minCapacity: (params.adults || 1) + (params.children || 0),
        quality: params.minRating ? params.minRating * 4 : undefined // Convert rating to quality scale
      });
      
      // Calculate total price for the stay
      const nights = params.checkIn && params.checkOut 
        ? Math.ceil((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 4; // Default 4 nights
      
      const totalPrice = calculateTotalPrice(bestRate, nights);
      const roomAmenities = getRoomAmenities(bestRate);
      
      return {
        id: hotel.id,
        hid: hotel.hid,
        name: getHotelName(hotel.id),
        location: getHotelLocation(hotel.id),
        rating: bestRate.rg_ext.quality / 4, // Convert quality to 5-star rating
        price: {
          amount: totalPrice,
          currency: bestRate.payment_options.payment_types[0].currency_code,
          perNight: parseFloat(bestRate.daily_prices[0])
        },
        images: getHotelImages(hotel.id),
        amenities: getHotelAmenities(hotel.id),
        rooms: [{
          id: bestRate.match_hash,
          name: bestRate.room_name,
          type: bestRate.room_data_trans.main_room_type,
          capacity: bestRate.rg_ext.capacity,
          maxOccupancy: bestRate.rg_ext.capacity,
          price: {
            amount: totalPrice,
            currency: bestRate.payment_options.payment_types[0].currency_code
          },
          amenities: roomAmenities,
          hasBreakfast: bestRate.meal_data.has_breakfast,
          cancellationPolicy: bestRate.payment_options.payment_types[0].cancellation_penalties.free_cancellation_before,
          commission: {
            amount: parseFloat(bestRate.payment_options.payment_types[0].commission_info.show.amount_commission),
            percentage: (parseFloat(bestRate.payment_options.payment_types[0].commission_info.show.amount_commission) / parseFloat(bestRate.payment_options.payment_types[0].commission_info.show.amount_gross)) * 100
          }
        }],
        // Include the original RateHawk data for advanced features
        rateHawkData: {
          hotel: hotel,
          selectedRate: bestRate
        }
      };
    });
    
    // Filter by destination if specified
    let filteredHotels = convertedHotels;
    if (params.destination) {
      filteredHotels = convertedHotels.filter(hotel => 
        hotel.location.city.toLowerCase().includes(params.destination!.toLowerCase()) ||
        hotel.location.country.toLowerCase().includes(params.destination!.toLowerCase())
      );
    }
    
    // Filter by price if specified
    if (params.maxPrice) {
      filteredHotels = filteredHotels.filter(hotel => hotel.price.amount <= params.maxPrice!);
    }
    
    // Filter by rating if specified
    if (params.minRating) {
      filteredHotels = filteredHotels.filter(hotel => hotel.rating >= params.minRating!);
    }
    
    console.log(`Found ${filteredHotels.length} hotels matching criteria`);
    
    return {
      hotels: filteredHotels,
      total: filteredHotels.length,
      searchParams: params
    };
  },

  async getHotelDetails(hotelId: string) {
    console.log('Getting hotel details for:', hotelId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const hotel = mockRateHawkHotels.data.hotels.find(h => h.id === hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    
    return {
      id: hotel.id,
      hid: hotel.hid,
      name: getHotelName(hotel.id),
      location: getHotelLocation(hotel.id),
      description: getHotelDescription(hotel.id),
      rating: 4.5,
      images: getHotelImages(hotel.id),
      amenities: getHotelAmenities(hotel.id),
      rooms: hotel.rates.map(rate => ({
        id: rate.match_hash,
        name: rate.room_name,
        type: rate.room_data_trans.main_room_type,
        capacity: rate.rg_ext.capacity,
        maxOccupancy: rate.rg_ext.capacity,
        price: {
          amount: parseFloat(rate.payment_options.payment_types[0].amount),
          currency: rate.payment_options.payment_types[0].currency_code
        },
        amenities: getRoomAmenities(rate),
        hasBreakfast: rate.meal_data.has_breakfast,
        cancellationPolicy: rate.payment_options.payment_types[0].cancellation_penalties.free_cancellation_before,
        commission: {
          amount: parseFloat(rate.payment_options.payment_types[0].commission_info.show.amount_commission),
          percentage: (parseFloat(rate.payment_options.payment_types[0].commission_info.show.amount_commission) / parseFloat(rate.payment_options.payment_types[0].commission_info.show.amount_gross)) * 100
        }
      })),
      rateHawkData: hotel
    };
  },

  async checkAvailability(hotelId: string, checkIn: string, checkOut: string, guests: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const hotel = await this.getHotelDetails(hotelId);
    if (!hotel) return false;
    
    // Check if any room can accommodate the guests
    return hotel.rooms.some(room => room.maxOccupancy >= guests && room.available);
  },

  async getRecommendations(city: string, guests: number, budget?: number): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const hotels = mockRateHawkHotels.data.hotels.filter(hotel => 
      hotel.location.city.toLowerCase().includes(city.toLowerCase())
    );
    
    // Sort by rating and filter by budget if provided
    let recommendations = hotels.sort((a, b) => b.rg_ext.quality - a.rg_ext.quality);
    
    if (budget) {
      recommendations = recommendations.filter(hotel =>
        hotel.rates.some(rate => rate.payment_options.payment_types[0].amount <= budget)
      );
    }
    
    return recommendations.slice(0, 3);
  }
};

// Helper functions to get hotel-specific data
function getHotelName(hotelId: string): string {
  const names: Record<string, string> = {
    'rila_muam_castle_hotel': 'Rila Muam Castle Hotel',
    'emirates_palace_mandarin_oriental': 'Emirates Palace Mandarin Oriental',
    'yas_hotel_abu_dhabi': 'Yas Hotel Abu Dhabi'
  };
  return names[hotelId] || 'Unknown Hotel';
}

function getHotelLocation(hotelId: string) {
  const locations: Record<string, any> = {
    'rila_muam_castle_hotel': {
      city: 'Abu Dhabi',
      country: 'UAE',
      address: 'Corniche Road, Abu Dhabi',
      coordinates: { lat: 24.4539, lng: 54.3773 }
    },
    'emirates_palace_mandarin_oriental': {
      city: 'Abu Dhabi',
      country: 'UAE',
      address: 'West Corniche Road, Abu Dhabi',
      coordinates: { lat: 24.4539, lng: 54.3773 }
    },
    'yas_hotel_abu_dhabi': {
      city: 'Abu Dhabi',
      country: 'UAE',
      address: 'Yas Island, Abu Dhabi',
      coordinates: { lat: 24.4539, lng: 54.3773 }
    }
  };
  return locations[hotelId] || { city: 'Unknown', country: 'Unknown' };
}

function getHotelDescription(hotelId: string): string {
  const descriptions: Record<string, string> = {
    'rila_muam_castle_hotel': 'A charming castle-style hotel offering comfortable accommodations in the heart of Abu Dhabi with easy access to major attractions.',
    'emirates_palace_mandarin_oriental': 'A luxurious 5-star palace hotel offering world-class amenities, stunning sea views, and exceptional service in the heart of Abu Dhabi.',
    'yas_hotel_abu_dhabi': 'A modern luxury hotel located on Yas Island, featuring contemporary design, marina views, and easy access to entertainment venues.'
  };
  return descriptions[hotelId] || 'A comfortable hotel offering quality accommodations.';
}

function getHotelImages(hotelId: string): string[] {
  const images: Record<string, string[]> = {
    'rila_muam_castle_hotel': [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
    ],
    'emirates_palace_mandarin_oriental': [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
    ],
    'yas_hotel_abu_dhabi': [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
    ]
  };
  return images[hotelId] || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'];
}

function getHotelAmenities(hotelId: string): string[] {
  const amenities: Record<string, string[]> = {
    'rila_muam_castle_hotel': ['Free WiFi', 'Restaurant', 'Bar', '24-hour Front Desk', 'Air Conditioning'],
    'emirates_palace_mandarin_oriental': ['Free WiFi', 'Spa', 'Swimming Pool', 'Restaurant', 'Bar', 'Concierge', 'Valet Parking', 'Room Service'],
    'yas_hotel_abu_dhabi': ['Free WiFi', 'Gym', 'Swimming Pool', 'Restaurant', 'Bar', 'Business Center', 'Spa']
  };
  return amenities[hotelId] || ['Free WiFi', 'Restaurant'];
} 