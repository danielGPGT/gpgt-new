import { mockTransfers, getMockTransfers, MockTransfer } from '@/lib/mockData/mockTransferData';

export interface TransferSearchParams {
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  passengers?: number;
  type?: 'private' | 'shared' | 'luxury' | 'helicopter';
  maxPrice?: number;
  currency?: string;
}

export interface TransferSearchResponse {
  transfers: MockTransfer[];
  totalResults: number;
  searchId: string;
  searchParams: TransferSearchParams;
}

export interface TransferBookingRequest {
  transferId: string;
  passengers: number;
  pickupTime: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    flightNumber?: string;
    hotelName?: string;
  };
  specialRequests?: string;
  extras?: Array<{
    name: string;
    price: number;
    currency: string;
  }>;
}

export interface TransferBookingResponse {
  bookingId: string;
  transfer: MockTransfer;
  passengers: number;
  pickupTime: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    flightNumber?: string;
    hotelName?: string;
  };
  specialRequests?: string;
  extras?: Array<{
    name: string;
    price: number;
    currency: string;
  }>;
  driverInfo?: {
    name: string;
    phone: string;
    vehiclePlate: string;
  };
}

export const mockTransferService = {
  async searchTransfers(params: TransferSearchParams): Promise<{ transfers: MockTransfer[] }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));

    console.log('Mock transfer search with params:', params);

    // If no parameters provided, return all transfers
    if (!params.from && !params.to && !params.passengers && !params.maxPrice) {
      console.log('No search parameters provided, returning all transfers');
      return { transfers: mockTransfers };
    }

    // Filter transfers based on search parameters
    let filteredTransfers = mockTransfers.filter(transfer => {
      // Match pickup and dropoff locations
      const fromMatch = !params.from || transfer.pickup.location.toLowerCase().includes(params.from.toLowerCase());
      const toMatch = !params.to || transfer.dropoff.location.toLowerCase().includes(params.to.toLowerCase());

      if (!fromMatch || !toMatch) return false;

      // Match passenger capacity
      if (params.passengers && transfer.vehicle.capacity < params.passengers) return false;

      // Match price
      if (params.maxPrice && transfer.price.amount > params.maxPrice) return false;

      return true;
    });

    // Sort by price (lowest first)
    filteredTransfers.sort((a, b) => a.price.amount - b.price.amount);

    return { transfers: filteredTransfers };
  },

  /**
   * Get transfer details by ID
   */
  async getTransferDetails(transferId: string): Promise<MockTransfer | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    const transfer = mockTransfers.find(t => t.id === transferId);
    return transfer || null;
  },

  /**
   * Book a transfer
   */
  async bookTransfer(request: TransferBookingRequest): Promise<TransferBookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const transfer = await this.getTransferDetails(request.transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (!transfer.available) {
      throw new Error('Transfer is not available');
    }

    if (transfer.vehicle.capacity < request.passengers) {
      throw new Error('Transfer capacity insufficient for number of passengers');
    }

    // Generate booking ID
    const bookingId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total price
    let totalPrice = transfer.price.perPerson ? 
      transfer.price.amount * request.passengers : 
      transfer.price.amount;

    // Add extras
    if (request.extras) {
      totalPrice += request.extras.reduce((sum, extra) => sum + extra.price, 0);
    }

    // Generate driver info
    const driverInfo = {
      name: `Driver ${Math.floor(Math.random() * 1000)}`,
      phone: `+33 6 ${Math.floor(Math.random() * 90000000) + 10000000}`,
      vehiclePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 900) + 100}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
    };

    // Create booking response
    const booking: TransferBookingResponse = {
      bookingId,
      transfer,
      passengers: request.passengers,
      pickupTime: request.pickupTime,
      totalPrice,
      currency: transfer.price.currency,
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
      customerInfo: request.customerInfo,
      specialRequests: request.specialRequests,
      extras: request.extras,
      driverInfo
    };

    // Store booking
    this.bookings.set(bookingId, booking);

    return booking;
  },

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId: string): Promise<TransferBookingResponse | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    return this.bookings.get(bookingId) || null;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<{
    success: boolean;
    refundAmount?: number;
    currency?: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Update booking status
    booking.status = 'cancelled';

    // Calculate refund (assuming 90% refund for cancellation with 24h notice)
    const refundAmount = Math.round(booking.totalPrice * 0.9);

    return {
      success: true,
      refundAmount,
      currency: booking.currency
    };
  },

  /**
   * Get popular transfer routes
   */
  async getPopularRoutes(): Promise<Array<{
    from: string;
    to: string;
    frequency: number;
    avgPrice: number;
    currency: string;
  }>> {
    return [
      { from: 'Charles de Gaulle Airport', to: 'Paris City Center', frequency: 150, avgPrice: 45, currency: 'EUR' },
      { from: 'Orly Airport', to: 'Paris City Center', frequency: 80, avgPrice: 35, currency: 'EUR' },
      { from: 'Paris City Center', to: 'Disneyland Paris', frequency: 60, avgPrice: 55, currency: 'EUR' },
      { from: 'Paris City Center', to: 'Versailles', frequency: 40, avgPrice: 65, currency: 'EUR' },
      { from: 'Charles de Gaulle Airport', to: 'Disneyland Paris', frequency: 30, avgPrice: 75, currency: 'EUR' }
    ];
  },

  /**
   * Get transfer recommendations based on user preferences
   */
  async getRecommendations(preferences: {
    budget?: number;
    passengers?: number;
    type?: 'private' | 'shared' | 'luxury' | 'helicopter';
    from?: string;
    to?: string;
  }): Promise<MockTransfer[]> {
    let recommendations = [...mockTransfers];

    if (preferences.from) {
      recommendations = recommendations.filter(transfer =>
        transfer.pickup.location.toLowerCase().includes(preferences.from!.toLowerCase())
      );
    }

    if (preferences.to) {
      recommendations = recommendations.filter(transfer =>
        transfer.dropoff.location.toLowerCase().includes(preferences.to!.toLowerCase())
      );
    }

    if (preferences.type) {
      recommendations = recommendations.filter(transfer =>
        transfer.type === preferences.type
      );
    }

    if (preferences.passengers) {
      recommendations = recommendations.filter(transfer =>
        transfer.vehicle.capacity >= preferences.passengers!
      );
    }

    if (preferences.budget) {
      recommendations = recommendations.filter(transfer => {
        const totalPrice = transfer.price.perPerson ? 
          transfer.price.amount * (preferences.passengers || 1) : 
          transfer.price.amount;
        return totalPrice <= preferences.budget!;
      });
    }

    // Sort by quality (luxury first, then by price)
    recommendations.sort((a, b) => {
      const typeOrder = { helicopter: 4, luxury: 3, private: 2, shared: 1 };
      const aType = typeOrder[a.type];
      const bType = typeOrder[b.type];
      
      if (aType !== bType) {
        return bType - aType;
      }
      
      const aPrice = a.price.perPerson ? a.price.amount * (preferences.passengers || 1) : a.price.amount;
      const bPrice = b.price.perPerson ? b.price.amount * (preferences.passengers || 1) : b.price.amount;
      return aPrice - bPrice;
    });

    return recommendations.slice(0, 5);
  },

  /**
   * Get transfer pricing for different times
   */
  async getPriceVariations(
    from: string,
    to: string,
    date: string,
    type: 'private' | 'shared' | 'luxury' = 'private'
  ): Promise<Array<{time: string, price: number, currency: string}>> {
    const basePrice = 80; // Base price for the route
    const variations = [];

    // Generate price variations for different times of day
    const times = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    
    times.forEach(time => {
      const hour = parseInt(time.split(':')[0]);
      
      // Peak hours (7-9 AM, 5-7 PM) are more expensive
      const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const priceMultiplier = isPeak ? 1.4 : 1.0;
      
      // Add some random variation
      const randomVariation = 0.9 + Math.random() * 0.2; // ±10% random variation
      
      const price = Math.round(basePrice * priceMultiplier * randomVariation);
      
      variations.push({
        time,
        price,
        currency: 'EUR'
      });
    });

    return variations;
  },

  /**
   * Check transfer availability for specific time
   */
  async checkAvailability(
    transferId: string,
    date: string,
    time: string,
    passengers: number
  ): Promise<{
    available: boolean;
    price: number;
    currency: string;
    estimatedDuration: string;
  }> {
    const transfer = await this.getTransferDetails(transferId);
    
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (!transfer.available) {
      return {
        available: false,
        price: 0,
        currency: transfer.price.currency,
        estimatedDuration: transfer.duration
      };
    }

    if (transfer.vehicle.capacity < passengers) {
      return {
        available: false,
        price: 0,
        currency: transfer.price.currency,
        estimatedDuration: transfer.duration
      };
    }

    const totalPrice = transfer.price.perPerson ? 
      transfer.price.amount * passengers : 
      transfer.price.amount;

    return {
      available: true,
      price: totalPrice,
      currency: transfer.price.currency,
      estimatedDuration: transfer.duration
    };
  }
}; 