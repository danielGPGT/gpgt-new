import { supabase } from './supabase';
import { gemini, type TripPreferences } from './gemini';
import { QuoteInput } from '@/utils/createQuotePayload';
import { CRMService } from './crmService';
import { getGeminiService } from './gemini';

export interface QuoteResponse {
  id: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  totalPrice: number;
  currency: string;
  generatedItinerary: any;
  createdAt: string;
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  destination?: string;
  startDate?: string;
  endDate?: string;
  clientName?: string;
  selectedEvent?: {
    id: string;
    name: string;
    dateOfEvent: string;
    venue: {
      name: string;
      city: string;
      country: string;
    };
  };
  selectedTicket?: {
    id: string;
    categoryName: string;
    price: number;
    currency: string;
    available: boolean;
  };
  selectedFlights?: Array<{
    originAirport: string;
    destinationAirport: string;
    cabinClass: string;
    airline?: string;
    flightNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
    total: number;
    currency: string;
  }>;
  selectedHotels?: Array<{
    hotelName: string;
    destinationCity: string;
    numberOfRooms: number;
    roomTypes: string[];
    starRating?: number;
    pricePerNight: number;
    currency: string;
    checkIn?: string;
    checkOut?: string;
  }>;
}

export interface QuoteError {
  message: string;
  code: string;
}

export class QuoteService {
  /**
   * Create a new quote with AI-generated itinerary
   */
  static async createQuote(quoteData: QuoteInput): Promise<QuoteResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Extract client ID if provided
      const clientId = quoteData.tripDetails.clientId;

      // Calculate budget breakdown from selected components
      const formDataForCalculation = {
        travelerInfo: {
          startDate: quoteData.tripDetails.startDate,
          endDate: quoteData.tripDetails.endDate,
          travelers: {
            adults: typeof quoteData.tripDetails.numberOfTravelers === 'number' 
              ? quoteData.tripDetails.numberOfTravelers 
              : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1,
            children: typeof quoteData.tripDetails.numberOfTravelers === 'number' 
              ? 0 
              : (quoteData.tripDetails.numberOfTravelers as any)?.children || 0
          }
        },
        flights: quoteData.selectedFlights ? {
          enabled: true,
          groups: quoteData.selectedFlights.map(flight => ({
            selectedFlight: {
              convertedTotal: flight.total,
              convertedCurrency: flight.currency,
              airline: flight.airline,
              flightNumber: flight.flightNumber,
              departureTime: flight.departureTime,
              arrivalTime: flight.arrivalTime
            },
            originAirport: flight.originAirport,
            destinationAirport: flight.destinationAirport,
            cabinClass: flight.cabinClass
          }))
        } : undefined,
        hotels: quoteData.selectedHotels ? {
          enabled: true,
          groups: quoteData.selectedHotels.map(hotel => ({
            selectedHotel: {
              convertedPricePerNight: hotel.pricePerNight,
              convertedCurrency: hotel.currency,
              hotelName: hotel.hotelName,
              destinationCity: hotel.destinationCity,
              destinationCountry: hotel.destinationCity.split(', ').pop() || '',
              starRating: hotel.starRating,
              amenities: []
            },
            numberOfRooms: hotel.numberOfRooms,
            roomTypes: hotel.roomTypes
          }))
        } : undefined,
        events: quoteData.selectedEvent && quoteData.selectedTicket ? {
          enabled: true,
          events: [{
            groups: [{
              selectedTicket: {
                convertedPrice: quoteData.selectedTicket.price,
                convertedCurrency: quoteData.selectedTicket.currency
              }
            }]
          }]
        } : undefined
      } as any;

      // Use the already-calculated prices from the form instead of recalculating
      const breakdown = {
        accommodation: {
          total: 0,
          perNight: 0,
          hotelRecommendations: [] as any[]
        },
        transportation: {
          total: 0,
          breakdown: [] as any[]
        },
        activities: {
          total: 0,
          breakdown: [] as any[]
        },
        dining: {
          total: 0,
          perDay: 0,
          recommendations: [] as any[]
        },
        miscellaneous: {
          total: 0,
          description: 'Contingency and tips.'
        }
      };

      // Calculate accommodation costs from selected hotels
      if (quoteData.selectedHotels) {
        const tripDuration = Math.ceil((new Date(quoteData.tripDetails.endDate).getTime() - new Date(quoteData.tripDetails.startDate).getTime()) / (1000 * 60 * 60 * 24));
        
        quoteData.selectedHotels.forEach(hotel => {
          const hotelTotal = hotel.pricePerNight * hotel.numberOfRooms * tripDuration;
          breakdown.accommodation.total += hotelTotal;
          breakdown.accommodation.perNight += hotel.pricePerNight;
          
          breakdown.accommodation.hotelRecommendations.push({
            name: hotel.hotelName,
            location: hotel.destinationCity,
            pricePerNight: hotel.pricePerNight,
            rating: `${hotel.starRating}★`,
            amenities: []
          });
        });
      }

      // Calculate transportation costs from selected flights
      if (quoteData.selectedFlights) {
        const totalTravelers = typeof quoteData.tripDetails.numberOfTravelers === 'number' 
          ? quoteData.tripDetails.numberOfTravelers 
          : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1;
        
        quoteData.selectedFlights.forEach(flight => {
          const flightTotal = flight.total * totalTravelers;
          breakdown.transportation.total += flightTotal;
          breakdown.transportation.breakdown.push({
            type: 'Flight',
            description: `${flight.originAirport} to ${flight.destinationAirport} (${flight.airline}, ${flight.flightNumber})`,
            cost: flightTotal
          });
        });
      }

      // Calculate activities costs from selected events
      if (quoteData.selectedEvent && quoteData.selectedTicket) {
        const totalTravelers = typeof quoteData.tripDetails.numberOfTravelers === 'number' 
          ? quoteData.tripDetails.numberOfTravelers 
          : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1;
        
        const eventTotal = quoteData.selectedTicket.price * totalTravelers;
        breakdown.activities.total += eventTotal;
        breakdown.activities.breakdown.push({
          name: quoteData.selectedEvent.name,
          cost: eventTotal,
          type: 'Event Ticket'
        });
      }

      // Calculate dining costs (estimated)
      const tripDuration = Math.ceil((new Date(quoteData.tripDetails.endDate).getTime() - new Date(quoteData.tripDetails.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const totalTravelers = typeof quoteData.tripDetails.numberOfTravelers === 'number' 
        ? quoteData.tripDetails.numberOfTravelers 
        : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1;
      const dailyDiningBudget = 100; // £100 per day per person
      breakdown.dining.total = dailyDiningBudget * tripDuration * totalTravelers;
      breakdown.dining.perDay = dailyDiningBudget * totalTravelers;

      // Calculate total budget
      const calculatedTotal = breakdown.accommodation.total + 
                             breakdown.transportation.total + 
                             breakdown.activities.total + 
                             breakdown.dining.total + 
                             breakdown.miscellaneous.total;
      
      console.log('💰 QuoteService - Calculated budget breakdown:', {
        breakdown,
        calculatedTotal,
        selectedFlights: quoteData.selectedFlights,
        selectedHotels: quoteData.selectedHotels,
        selectedEvent: quoteData.selectedEvent,
        selectedTicket: quoteData.selectedTicket
      });

      // Use calculated total instead of AI-generated pricing
      const baseCost = calculatedTotal;
      const margin = baseCost * 0.15; // 15% margin
      const totalPrice = baseCost + margin;

      // Create trip preferences for Gemini (without pricing)
      const tripPreferences = {
        clientName: quoteData.tripDetails.clientName,
        destination: quoteData.tripDetails.destination,
        startDate: quoteData.tripDetails.startDate,
        endDate: quoteData.tripDetails.endDate,
        numberOfTravelers: typeof quoteData.tripDetails.numberOfTravelers === 'number' 
          ? quoteData.tripDetails.numberOfTravelers 
          : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1,
        budget: {
          min: quoteData.budget.amount * 0.8,
          max: quoteData.budget.amount,
          currency: quoteData.budget.currency,
        },
        preferences: {
          tone: quoteData.preferences.tone,
          pace: quoteData.preferences.pace as 'relaxed' | 'moderate' | 'active',
          interests: quoteData.preferences.interests,
          accommodationType: quoteData.preferences.accommodationType,
          diningPreferences: quoteData.preferences.diningPreferences,
        },
        specialRequests: quoteData.preferences.specialRequests,
        transportType: quoteData.tripDetails.transportType,
        fromLocation: quoteData.tripDetails.fromLocation,
        travelType: quoteData.tripDetails.travelType,
        selectedFlights: quoteData.selectedFlights,
        selectedHotels: quoteData.selectedHotels,
        selectedEvent: quoteData.selectedEvent,
        selectedTicket: quoteData.selectedTicket,
      };

      console.log('🎯 QuoteService - Generating itinerary with Gemini:', {
        clientName: tripPreferences.clientName,
        destination: tripPreferences.destination,
        hasSelectedFlights: !!tripPreferences.selectedFlights,
        selectedFlightsCount: tripPreferences.selectedFlights?.length || 0,
        selectedFlightsData: tripPreferences.selectedFlights,
        hasSelectedHotels: !!tripPreferences.selectedHotels,
        selectedHotelsCount: tripPreferences.selectedHotels?.length || 0,
        selectedHotelsData: tripPreferences.selectedHotels,
        hasSelectedEvent: !!tripPreferences.selectedEvent,
        hasSelectedTicket: !!tripPreferences.selectedTicket,
        specialRequests: tripPreferences.specialRequests
      });
      
      const gemini = getGeminiService();
      const generatedItinerary = await gemini.generateItinerary(tripPreferences);
      
      // Replace the AI-generated budget breakdown with our calculated one
      generatedItinerary.budgetBreakdown = breakdown;
      generatedItinerary.totalBudget = {
        amount: calculatedTotal,
        currency: quoteData.budget.currency
      };
      
      console.log('✅ QuoteService - Itinerary generated successfully with calculated pricing:', {
        generatedItinerary: generatedItinerary,
        breakdown: breakdown,
        calculatedTotal: calculatedTotal
      });

      // Save to Supabase
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          client_id: clientId,
          client_name: quoteData.tripDetails.clientName,
          client_email: quoteData.tripDetails.clientEmail,
          client_phone: quoteData.tripDetails.clientPhone,
          client_address: quoteData.tripDetails.clientAddress,
          destination: quoteData.tripDetails.destination,
          start_date: quoteData.tripDetails.startDate,
          end_date: quoteData.tripDetails.endDate,
          travelers: { 
            adults: typeof quoteData.tripDetails.numberOfTravelers === 'number' 
              ? quoteData.tripDetails.numberOfTravelers 
              : (quoteData.tripDetails.numberOfTravelers as any)?.adults || 1,
            children: typeof quoteData.tripDetails.numberOfTravelers === 'number' 
              ? 0 
              : (quoteData.tripDetails.numberOfTravelers as any)?.children || 0
          },
          trip_details: quoteData.tripDetails,
          preferences: quoteData.preferences,
          budget: quoteData.budget,
          include_inventory: quoteData.includeInventory,
          filters: quoteData.filters,
          agent_context: quoteData.agentContext,
          selected_event: quoteData.selectedEvent,
          selected_ticket: quoteData.selectedTicket,
          selected_flights: quoteData.selectedFlights,
          selected_hotels: quoteData.selectedHotels,
          base_cost: baseCost,
          margin: margin,
          total_price: totalPrice,
          currency: quoteData.budget.currency,
          generated_itinerary: generatedItinerary,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save quote: ${error.message}`);
      }

      // Create interaction record for the client
      if (clientId) {
        await CRMService.createInteraction({
          clientId,
          interactionType: 'quote_sent',
          subject: `Quote for ${quoteData.tripDetails.destination}`,
          content: `Generated quote for ${quoteData.tripDetails.destination} trip`,
          outcome: 'Quote created and sent to client',
        });
      }

      return {
        id: quote.id,
        status: quote.status,
        totalPrice: quote.total_price,
        currency: quote.currency,
        generatedItinerary: quote.generated_itinerary,
        createdAt: quote.created_at,
        clientId: quote.client_id,
        clientEmail: quote.client_email,
        clientPhone: quote.client_phone,
        clientAddress: quote.client_address,
        destination: quote.destination,
        startDate: quote.start_date,
        endDate: quote.end_date,
        clientName: quote.client_name,
        selectedEvent: quote.selected_event,
        selectedTicket: quote.selected_ticket,
        selectedFlights: quote.selected_flights,
        selectedHotels: quote.selected_hotels,
      };

    } catch (error) {
      console.error('Quote creation error:', error);
      throw error;
    }
  }

  /**
   * Get all quotes for the current user
   */
  static async getQuotes(): Promise<QuoteResponse[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch quotes: ${error.message}`);
      }

      return quotes.map(quote => ({
        id: quote.id,
        status: quote.status,
        totalPrice: quote.total_price,
        currency: quote.currency,
        generatedItinerary: quote.generated_itinerary,
        createdAt: quote.created_at,
        clientId: quote.client_id,
        clientEmail: quote.client_email,
        clientPhone: quote.client_phone,
        clientAddress: quote.client_address,
        destination: quote.destination,
        startDate: quote.start_date,
        endDate: quote.end_date,
        clientName: quote.client_name,
        selectedEvent: quote.selected_event,
        selectedTicket: quote.selected_ticket,
        selectedFlights: quote.selected_flights,
        selectedHotels: quote.selected_hotels,
      }));

    } catch (error) {
      console.error('Fetch quotes error:', error);
      throw error;
    }
  }

  /**
   * Get quotes for a specific client
   */
  static async getQuotesByClient(clientId: string): Promise<QuoteResponse[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch client quotes: ${error.message}`);
      }

      return quotes.map(quote => ({
        id: quote.id,
        status: quote.status,
        totalPrice: quote.total_price,
        currency: quote.currency,
        generatedItinerary: quote.generated_itinerary,
        createdAt: quote.created_at,
        clientId: quote.client_id,
        clientEmail: quote.client_email,
        clientPhone: quote.client_phone,
        clientAddress: quote.client_address,
        destination: quote.destination,
        startDate: quote.start_date,
        endDate: quote.end_date,
        clientName: quote.client_name,
        selectedEvent: quote.selected_event,
        selectedTicket: quote.selected_ticket,
        selectedFlights: quote.selected_flights,
        selectedHotels: quote.selected_hotels,
      }));

    } catch (error) {
      console.error('Fetch client quotes error:', error);
      throw error;
    }
  }

  /**
   * Get a specific quote by ID
   */
  static async getQuoteById(quoteId: string): Promise<QuoteResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch quote: ${error.message}`);
      }

      if (!quote) {
        throw new Error('Quote not found');
      }

      return {
        id: quote.id,
        status: quote.status,
        totalPrice: quote.total_price,
        currency: quote.currency,
        generatedItinerary: quote.generated_itinerary,
        createdAt: quote.created_at,
        clientId: quote.client_id,
        clientEmail: quote.client_email,
        clientPhone: quote.client_phone,
        clientAddress: quote.client_address,
        destination: quote.destination,
        startDate: quote.start_date,
        endDate: quote.end_date,
        clientName: quote.client_name,
        selectedEvent: quote.selected_event,
        selectedTicket: quote.selected_ticket,
        selectedFlights: quote.selected_flights,
        selectedHotels: quote.selected_hotels,
      };

    } catch (error) {
      console.error('Fetch quote error:', error);
      throw error;
    }
  }

  /**
   * Update quote status
   */
  static async updateQuoteStatus(quoteId: string, status: 'draft' | 'confirmed' | 'cancelled'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('quotes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to update quote: ${error.message}`);
      }

    } catch (error) {
      console.error('Update quote error:', error);
      throw error;
    }
  }

  /**
   * Confirm a quote and create a booking
   */
  static async confirmQuote(quoteId: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the quote first
      const quote = await this.getQuoteById(quoteId);

      if (quote.status !== 'draft') {
        throw new Error('Only draft quotes can be confirmed');
      }

      // Create booking data from quote
      const bookingData = {
        quoteId: quoteId,
        clientName: quote.generatedItinerary?.clientName || 'Unknown',
        destination: quote.generatedItinerary?.destination || 'Unknown',
        startDate: quote.generatedItinerary?.days?.[0]?.date || new Date().toISOString(),
        endDate: quote.generatedItinerary?.days?.[quote.generatedItinerary?.days?.length - 1]?.date || new Date().toISOString(),
        totalCost: quote.totalPrice,
        currency: quote.currency,
        itinerary: quote.generatedItinerary,
        confirmedAt: new Date().toISOString(),
        supplierRef: null, // Will be filled when actual bookings are made
      };

      // Create the booking
      const bookingId = await this.createBooking(quoteId, bookingData);

      console.log('✅ Quote confirmed and booking created:', {
        quoteId,
        bookingId,
        clientName: bookingData.clientName,
        totalCost: bookingData.totalCost,
        currency: bookingData.currency
      });

      return bookingId;

    } catch (error) {
      console.error('Confirm quote error:', error);
      throw error;
    }
  }

  /**
   * Create a booking from a quote
   */
  static async createBooking(quoteId: string, bookingData: any): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the quote first
      const quote = await this.getQuoteById(quoteId);

      const bookingPayload = {
        quote_id: quoteId,
        user_id: user.id,
        client_name: quote.generatedItinerary?.clientName || 'Unknown',
        booking_data: bookingData,
        total_cost: quote.totalPrice,
        currency: quote.currency,
        status: 'confirmed',
        supplier_ref: bookingData.supplierRef || null,
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(bookingPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create booking: ${error.message}`);
      }

      // Update quote status to confirmed
      await this.updateQuoteStatus(quoteId, 'confirmed');

      return booking.id;

    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  /**
   * Delete a quote by ID
   */
  static async deleteQuote(quoteId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete quote: ${error.message}`);
      }

    } catch (error) {
      console.error('Delete quote error:', error);
      throw error;
    }
  }

  // Private helper methods

  private static async calculateBaseCosts(quoteData: QuoteInput): Promise<number> {
    let baseCost = 0;

    // If we have selected components with actual prices, use those
    if (quoteData.packageComponents?.selectedItems?.length > 0) {
      console.log('💰 Using selected component prices from intake form');
      
      // Use the budget amount which now contains the calculated total from selected components
      baseCost = quoteData.budget.amount;
      
      console.log('📊 Base cost from selected components:', {
        totalCost: baseCost,
        currency: quoteData.budget.currency,
        selectedItems: quoteData.packageComponents.selectedItems,
        aiAnalysis: quoteData.packageComponents.aiAnalysis
      });
      
      return baseCost;
    }

    // Fallback to mock calculation if no selected components
    console.log('💰 Using fallback mock calculations');
    
    // Base trip cost
    baseCost += quoteData.budget.amount * 0.7; // Assume 70% of budget is base cost

    // Add inventory costs if requested
    if (quoteData.includeInventory.flights) {
      baseCost += 800; // Mock flight cost
    }
    if (quoteData.includeInventory.hotels) {
      baseCost += 1200; // Mock hotel cost
    }
    if (quoteData.includeInventory.events) {
      baseCost += 300; // Mock event cost
    }

    // Add selected event ticket costs per traveler
    if (quoteData.selectedEvent && quoteData.selectedTicket) {
      const ticketCostPerPerson = quoteData.selectedTicket.price;
      const numberOfTravelers = quoteData.tripDetails.numberOfTravelers;
      const totalTicketCost = ticketCostPerPerson * numberOfTravelers;
      
      console.log('🎫 Adding event ticket costs:', {
        eventName: quoteData.selectedEvent.name,
        ticketType: quoteData.selectedTicket.categoryName,
        ticketPrice: ticketCostPerPerson,
        currency: quoteData.selectedTicket.currency,
        numberOfTravelers,
        totalTicketCost
      });
      
      baseCost += totalTicketCost;
    }

    return baseCost;
  }

  private static calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
} 