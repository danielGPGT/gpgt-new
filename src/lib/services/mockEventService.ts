import { mockEvents, getMockEvents, MockEvent, MockTicket } from '@/lib/mockData';

export interface EventSearchParams {
  city?: string;
  date?: string;
  type?: 'concert' | 'sports' | 'theater' | 'festival' | 'exhibition';
  category?: string;
  maxPrice?: number;
  currency?: string;
}

export interface EventSearchResponse {
  events: MockEvent[];
  totalResults: number;
  searchId: string;
  searchParams: EventSearchParams;
}

export interface TicketBookingRequest {
  eventId: string;
  ticketId: string;
  quantity: number;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface TicketBookingResponse {
  bookingId: string;
  event: MockEvent;
  ticket: MockTicket;
  quantity: number;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

class MockEventService {
  private bookings: Map<string, TicketBookingResponse> = new Map();

  /**
   * Search for events based on parameters
   */
  async searchEvents(params: EventSearchParams): Promise<EventSearchResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    let filteredEvents = [...mockEvents];

    // Filter by city
    if (params.city) {
      filteredEvents = filteredEvents.filter(event =>
        event.venue.city.toLowerCase().includes(params.city!.toLowerCase())
      );
    }

    // Filter by date
    if (params.date) {
      filteredEvents = filteredEvents.filter(event =>
        event.dateOfEvent === params.date
      );
    }

    // Filter by type
    if (params.type) {
      filteredEvents = filteredEvents.filter(event =>
        event.type === params.type
      );
    }

    // Filter by category
    if (params.category) {
      filteredEvents = filteredEvents.filter(event =>
        event.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }

    // Filter by max price
    if (params.maxPrice) {
      filteredEvents = filteredEvents.filter(event =>
        event.tickets.some(ticket => ticket.price.amount <= params.maxPrice!)
      );
    }

    return {
      events: filteredEvents,
      totalResults: filteredEvents.length,
      searchId: `event_search_${Date.now()}`,
      searchParams: params
    };
  }

  /**
   * Get event details by ID
   */
  async getEventDetails(eventId: string): Promise<MockEvent | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    const event = mockEvents.find(e => e.id === eventId);
    return event || null;
  }

  /**
   * Get available tickets for an event
   */
  async getAvailableTickets(eventId: string): Promise<MockTicket[]> {
    const event = await this.getEventDetails(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    return event.tickets.filter(ticket => ticket.available && ticket.quantity > 0);
  }

  /**
   * Book tickets for an event
   */
  async bookTickets(request: TicketBookingRequest): Promise<TicketBookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const event = await this.getEventDetails(request.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const ticket = event.tickets.find(t => t.id === request.ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (!ticket.available || ticket.quantity < request.quantity) {
      throw new Error('Insufficient tickets available');
    }

    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total price
    const totalPrice = ticket.price.amount * request.quantity;

    // Create booking response
    const booking: TicketBookingResponse = {
      bookingId,
      event,
      ticket,
      quantity: request.quantity,
      totalPrice,
      currency: ticket.price.currency,
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
      customerInfo: request.customerInfo
    };

    // Store booking
    this.bookings.set(bookingId, booking);

    // Update ticket availability (in real scenario, this would be done in database)
    ticket.quantity -= request.quantity;
    if (ticket.quantity === 0) {
      ticket.available = false;
    }

    return booking;
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId: string): Promise<TicketBookingResponse | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    return this.bookings.get(bookingId) || null;
  }

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

    // Calculate refund (assuming 80% refund for cancellation)
    const refundAmount = Math.round(booking.totalPrice * 0.8);

    // Restore ticket quantity
    const ticket = booking.ticket;
    ticket.quantity += booking.quantity;
    ticket.available = true;

    return {
      success: true,
      refundAmount,
      currency: booking.currency
    };
  }

  /**
   * Get popular events
   */
  async getPopularEvents(city?: string): Promise<MockEvent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    let events = [...mockEvents];

    if (city) {
      events = events.filter(event =>
        event.venue.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Sort by popularity (using capacity and ticket prices as proxy)
    events.sort((a, b) => {
      const aPopularity = a.venue.capacity * (a.tickets[0]?.price.amount || 0);
      const bPopularity = b.venue.capacity * (b.tickets[0]?.price.amount || 0);
      return bPopularity - aPopularity;
    });

    return events.slice(0, 5);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(city?: string, days: number = 30): Promise<MockEvent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    let events = mockEvents.filter(event => {
      const eventDate = new Date(event.dateOfEvent);
      return eventDate >= today && eventDate <= futureDate;
    });

    if (city) {
      events = events.filter(event =>
        event.venue.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Sort by date
    events.sort((a, b) => new Date(a.dateOfEvent).getTime() - new Date(b.dateOfEvent).getTime());

    return events;
  }

  /**
   * Get event recommendations based on user preferences
   */
  async getRecommendations(preferences: {
    budget?: number;
    interests?: string[];
    city?: string;
    date?: string;
  }): Promise<MockEvent[]> {
    let recommendations = [...mockEvents];

    if (preferences.city) {
      recommendations = recommendations.filter(event =>
        event.venue.city.toLowerCase().includes(preferences.city!.toLowerCase())
      );
    }

    if (preferences.budget) {
      recommendations = recommendations.filter(event =>
        event.tickets.some(ticket => ticket.price.amount <= preferences.budget!)
      );
    }

    if (preferences.interests && preferences.interests.length > 0) {
      recommendations = recommendations.filter(event =>
        preferences.interests!.some(interest =>
          event.category.toLowerCase().includes(interest.toLowerCase()) ||
          event.type.toLowerCase().includes(interest.toLowerCase())
        )
      );
    }

    // Sort by relevance (date proximity, then price)
    recommendations.sort((a, b) => {
      if (preferences.date) {
        const aDate = new Date(a.dateOfEvent);
        const bDate = new Date(b.dateOfEvent);
        const targetDate = new Date(preferences.date);
        
        const aDiff = Math.abs(aDate.getTime() - targetDate.getTime());
        const bDiff = Math.abs(bDate.getTime() - targetDate.getTime());
        
        if (aDiff !== bDiff) {
          return aDiff - bDiff;
        }
      }
      
      const aPrice = a.tickets[0]?.price.amount || 0;
      const bPrice = b.tickets[0]?.price.amount || 0;
      return aPrice - bPrice;
    });

    return recommendations.slice(0, 5);
  }
}

export const mockEventService = new MockEventService(); 