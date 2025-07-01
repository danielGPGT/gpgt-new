import { TripIntake, FlightFilters, HotelFilters, EventFilters, AgentContext, PackageComponents } from '@/types/trip';
import { useIntakeStore } from '@/store/intake';

export interface QuoteInput {
  clientId?: string;
  tripDetails: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    destination: string;
    startDate: string;
    endDate: string;
    numberOfTravelers: number;
  };
  preferences: {
    tone: string;
    interests: string[];
    pace: string;
    accommodationType: string[];
    diningPreferences: string[];
    specialRequests?: string;
  };
  budget: {
    amount: number;
    currency: string;
    travelClass: string;
  };
  includeInventory: {
    flights: boolean;
    hotels: boolean;
    events: boolean;
  };
  filters: {
    flightFilters?: FlightFilters;
    hotelFilters?: HotelFilters;
    eventFilters?: EventFilters;
  };
  agentContext?: AgentContext;
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
  selectedHotel?: {
    hotel: {
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
    };
    room: {
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
    };
    selectedAt: string;
  };
  packageComponents?: PackageComponents;
}

export function createQuotePayload(formData: TripIntake): QuoteInput {
  // Convert interests to accommodation types and dining preferences
  const accommodationType = [formData.experience.accommodation];
  const diningPreferences = formData.style.interests.filter(interest => 
    ['fine-dining', 'wine', 'local-culture'].includes(interest)
  );

  // Get event data from the intake store
  const { intakeData } = useIntakeStore.getState();
  const selectedEvent = (intakeData as any)?.selectedEvent;
  const selectedTicket = (intakeData as any)?.selectedTicket;
  
  // Create event-specific special requests if an event is selected
  const eventSpecialRequests = selectedEvent ? 
    `EVENT FOCUSED TRIP: The main purpose of this trip is to attend ${selectedEvent.name} on ${selectedEvent.dateOfEvent}. Ticket type: ${selectedTicket?.categoryName}. This event should be the absolute centerpiece of the entire itinerary. All activities should be planned around this event, including proper transportation to/from the venue, accommodation near the event location, and complementary activities that enhance the event experience.` : 
    undefined;

  // Create package components special requests if components are selected
  const packageSpecialRequests = formData.packageComponents?.selectedItems.length ? 
    `PACKAGE COMPONENTS SELECTED: ${formData.packageComponents.selectedItems.length} components chosen. AI Analysis: ${formData.packageComponents.aiAnalysis}. Selected items: ${formData.packageComponents.selectedItems.join(', ')}.` : 
    undefined;
  
  // Combine existing special requests with event and package requests
  const combinedSpecialRequests = [
    formData.experience.specialRequests, 
    eventSpecialRequests,
    packageSpecialRequests
  ]
    .filter(Boolean)
    .join(' ');

  return {
    clientId: formData.clientId,
    tripDetails: {
      clientName: formData.travelerInfo.name,
      clientEmail: formData.travelerInfo.email,
      clientPhone: formData.travelerInfo.phone,
      clientAddress: formData.travelerInfo.address,
      destination: formData.destinations.primary,
      startDate: formData.travelerInfo.startDate,
      endDate: formData.travelerInfo.endDate,
      numberOfTravelers: formData.travelerInfo.travelers.adults + formData.travelerInfo.travelers.children,
    },
    preferences: {
      tone: formData.style.tone,
      interests: formData.style.interests,
      pace: formData.experience.pace,
      accommodationType: accommodationType,
      diningPreferences: diningPreferences,
      specialRequests: combinedSpecialRequests || undefined,
    },
    budget: {
      amount: formData.budget.amount,
      currency: formData.budget.currency,
      travelClass: formData.budget.travelClass,
    },
    includeInventory: formData.includeInventory,
    filters: {
      flightFilters: formData.flightFilters,
      hotelFilters: formData.hotelFilters,
      eventFilters: formData.eventFilters,
    },
    agentContext: formData.agentContext,
    selectedEvent: selectedEvent ? {
      id: selectedEvent.id,
      name: selectedEvent.name,
      dateOfEvent: selectedEvent.dateOfEvent,
      venue: {
        name: selectedEvent.venue.name,
        city: selectedEvent.venue.city,
        country: selectedEvent.venue.country,
      },
    } : undefined,
    selectedTicket: selectedTicket ? {
      id: selectedTicket.id,
      categoryName: selectedTicket.categoryName,
      price: selectedTicket.price,
      currency: selectedTicket.currency,
      available: selectedTicket.available,
    } : undefined,
    selectedFlights: (intakeData as any)?.selectedFlights,
    selectedHotels: (intakeData as any)?.selectedHotels,
    selectedHotel: (intakeData as any)?.selectedHotel ? {
      hotel: {
        id: (intakeData as any)?.selectedHotel.hotelId,
        name: (intakeData as any)?.selectedHotel.hotelName,
        rating: (intakeData as any)?.selectedHotel.starRating,
        stars: (intakeData as any)?.selectedHotel.stars,
        address: {
          country: (intakeData as any)?.selectedHotel.country,
          city: (intakeData as any)?.selectedHotel.city,
          street: (intakeData as any)?.selectedHotel.street,
          zip: (intakeData as any)?.selectedHotel.zip,
        },
        location: {
          latitude: (intakeData as any)?.selectedHotel.latitude,
          longitude: (intakeData as any)?.selectedHotel.longitude,
        },
        images: (intakeData as any)?.selectedHotel.images,
        amenities: (intakeData as any)?.selectedHotel.amenities,
        description: (intakeData as any)?.selectedHotel.description,
      },
      room: {
        id: (intakeData as any)?.selectedHotel.roomId,
        name: (intakeData as any)?.selectedHotel.roomName,
        type: (intakeData as any)?.selectedHotel.roomType,
        capacity: {
          adults: (intakeData as any)?.selectedHotel.adults,
          children: (intakeData as any)?.selectedHotel.children,
        },
        price: {
          amount: (intakeData as any)?.selectedHotel.price,
          currency: (intakeData as any)?.selectedHotel.currency,
          originalAmount: (intakeData as any)?.selectedHotel.originalPrice,
        },
        cancellationPolicy: (intakeData as any)?.selectedHotel.cancellationPolicy,
        boardType: (intakeData as any)?.selectedHotel.boardType,
        refundable: (intakeData as any)?.selectedHotel.refundable,
        available: (intakeData as any)?.selectedHotel.available,
      },
      selectedAt: (intakeData as any)?.selectedHotel.selectedAt,
    } : undefined,
    packageComponents: formData.packageComponents || undefined,
  };
} 