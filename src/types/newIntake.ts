import { z } from 'zod';

// Enums for the new intake form
export const tripPurposeEnum = z.enum(['leisure', 'honeymoon', 'business', 'group-celebration']);
export const toneEnum = z.enum(['luxury', 'romantic', 'relaxed', 'vip', 'family']);
export const currencyEnum = z.enum(['GBP', 'USD', 'EUR']);
export const cabinClassEnum = z.enum(['economy', 'premium_economy', 'business', 'first']);
export const vehicleTypeEnum = z.enum(['sedan', 'executive', 'van', 'minibus']);
export const eventTypeEnum = z.enum(['f1', 'football', 'concerts', 'sightseeing', 'theatre', 'sports', 'cultural']);
export const seatPreferenceEnum = z.enum(['general', 'vip', 'hospitality', 'premium']);

// Travel priorities
export const travelPrioritiesEnum = z.enum(['comfort', 'speed', 'experience', 'privacy', 'cost']);

// Client schema
export const clientSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  preferences: z.object({
    language: z.string().default('en'),
    tone: toneEnum.optional(),
    notes: z.string().optional(),
  }).optional(),
  pastTrips: z.array(z.object({
    id: z.string(),
    destination: z.string(),
    date: z.string(),
    type: z.string(),
  })).optional(),
});

// Traveler group schema
export const travelerGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Group name is required'),
  adults: z.number().min(1, 'At least one adult required'),
  children: z.number().min(0).default(0),
  childAges: z.array(z.number()).optional(),
  travelerNames: z.array(z.object({
    name: z.string(),
    type: z.enum(['adult', 'child']),
    age: z.number().optional(),
  })).optional(),
  notes: z.string().optional(),
  // Flight preferences
  flightPreferences: z.object({
    originAirport: z.string().optional(),
    cabinClass: cabinClassEnum.optional(),
    preferredAirlines: z.array(z.string()).optional(),
    flexibleDates: z.boolean().default(false),
    frequentFlyerInfo: z.string().optional(),
  }).optional(),
  // Hotel preferences
  hotelPreferences: z.object({
    destinationCity: z.string().optional(),
    numberOfRooms: z.number().min(1).optional(),
    roomTypes: z.array(z.string()).optional(),
    starRating: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    useSameHotelAs: z.string().optional(), // Group ID
  }).optional(),
  // Transfer preferences
  transferPreferences: z.object({
    arrivalTransfer: z.boolean().default(false),
    departureTransfer: z.boolean().default(false),
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional(),
    vehicleType: vehicleTypeEnum.optional(),
    luggageQuantity: z.number().min(1).default(1),
  }).optional(),
});

// Flight section schema
export const flightSectionSchema = z.object({
  enabled: z.boolean().default(false),
  groups: z.array(z.object({
    groupId: z.string(),
    originAirport: z.string().min(3, 'Origin airport is required'),
    destinationAirport: z.string().min(3, 'Destination airport is required'),
    cabinClass: cabinClassEnum.default('economy'),
    preferredAirlines: z.array(z.string()).default([]),
    flexibleDates: z.boolean().default(false),
    frequentFlyerInfo: z.string().optional(),
    // Selected flight data
    selectedFlight: z.object({
      recommendationId: z.string().optional(),
      routing: z.string().optional(),
      total: z.number().optional(),
      currency: z.string().optional(),
      airline: z.string().optional(),
      flightNumber: z.string().optional(),
      departureTime: z.string().optional(),
      arrivalTime: z.string().optional(),
      // Converted price fields
      convertedTotal: z.number().optional(),
      convertedCurrency: z.string().optional(),
    }).optional(),
  })),
});

// Hotel section schema
export const hotelSectionSchema = z.object({
  enabled: z.boolean().default(false),
  groups: z.array(z.object({
    groupId: z.string(),
    destinationCity: z.string().min(1, 'Destination city is required'),
    numberOfRooms: z.number().min(1, 'Number of rooms is required'),
    roomTypes: z.array(z.string()).default(['standard']),
    starRating: z.number().min(1).max(5).optional(),
    amenities: z.array(z.string()).default([]),
    useSameHotelAs: z.string().optional(),
    // Selected hotel data
    selectedHotel: z.object({
      hotelId: z.string().optional(),
      hotelName: z.string().optional(),
      pricePerNight: z.number().optional(),
      currency: z.string().optional(),
      roomType: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      // Converted price fields
      convertedPricePerNight: z.number().optional(),
      convertedCurrency: z.string().optional(),
    }).optional(),
  })),
});

// Transfer section schema
export const transferSectionSchema = z.object({
  enabled: z.boolean().default(false),
  groups: z.array(z.object({
    groupId: z.string(),
    arrivalTransfer: z.boolean().default(false),
    departureTransfer: z.boolean().default(false),
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional(),
    vehicleType: vehicleTypeEnum.default('sedan'),
    luggageQuantity: z.number().min(1).default(1),
  })),
});

// Event section schema
export const eventSectionSchema = z.object({
  enabled: z.boolean().default(false),
  events: z.array(z.object({
    id: z.string(),
    type: eventTypeEnum,
    name: z.string().min(1, 'Event name is required'),
    date: z.string().min(1, 'Event date is required'),
    venue: z.string().optional(),
    groups: z.array(z.object({
      groupId: z.string(),
      tickets: z.number().min(1, 'Number of tickets is required'),
      seatPreference: seatPreferenceEnum.default('general'),
      addOns: z.array(z.string()).default([]),
      ticketDetails: z.object({
        categoryName: z.string().optional(),
        categoryMain: z.string().optional(),
        categorySecondary: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().optional(),
        availableQuantity: z.number().optional(),
        immediateConfirmation: z.boolean().optional(),
        restrictions: z.array(z.string()).optional(),
        importantNotes: z.string().optional(),
        purchaseAlert: z.string().optional(),
        // Converted price fields
        convertedPrice: z.number().optional(),
        convertedCurrency: z.string().optional(),
      }).optional(),
    })),
  })),
});

// Main new intake schema
export const newIntakeSchema = z.object({
  // Step 0: Client Selection
  client: clientSchema,
  isNewClient: z.boolean().default(false),
  
  // Step 1: Trip Details
  tripDetails: z.object({
    tripName: z.string().min(1, 'Trip name is required'),
    primaryDestination: z.string().min(1, 'Primary destination is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    duration: z.number().min(1, 'Duration is required'),
    purpose: tripPurposeEnum.default('leisure'),
    totalTravelers: z.object({
      adults: z.number().min(1, 'At least one adult required'),
      children: z.number().min(0).default(0),
    }),
    useSubgroups: z.boolean().default(false),
    groups: z.array(travelerGroupSchema).default([]),
  }),
  
  // Step 2: Client Preferences
  preferences: z.object({
    tone: toneEnum.default('luxury'),
    currency: currencyEnum.default('GBP'),
    budget: z.object({
      amount: z.number().min(1, 'Budget amount must be at least 1').optional(),
      type: z.enum(['per-person', 'total']).default('total'),
    }),
    language: z.string().default('en'),
    specialRequests: z.string().optional(),
    travelPriorities: z.array(travelPrioritiesEnum).default(['comfort', 'experience']),
  }),
  
  // Step 3: Flights
  flights: flightSectionSchema,
  
  // Step 4: Hotels
  hotels: hotelSectionSchema,
  
  // Step 5: Transfers
  transfers: transferSectionSchema,
  
  // Step 6: Events
  events: eventSectionSchema,
  
  // Step 7: Summary & Submission
  summary: z.object({
    internalNotes: z.string().optional(),
    quoteReference: z.string().optional(),
    agentId: z.string().optional(),
  }),
  
  // Metadata
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'processing', 'completed']).default('draft'),
    version: z.string().default('1.0'),
  }),
});

// Type exports
export type NewIntake = z.infer<typeof newIntakeSchema>;
export type Client = z.infer<typeof clientSchema>;
export type TravelerGroup = z.infer<typeof travelerGroupSchema>;
export type FlightSection = z.infer<typeof flightSectionSchema>;
export type HotelSection = z.infer<typeof hotelSectionSchema>;
export type TransferSection = z.infer<typeof transferSectionSchema>;
export type EventSection = z.infer<typeof eventSectionSchema>;
export type TripPurpose = z.infer<typeof tripPurposeEnum>;
export type Tone = z.infer<typeof toneEnum>;
export type Currency = z.infer<typeof currencyEnum>;
export type CabinClass = z.infer<typeof cabinClassEnum>;
export type VehicleType = z.infer<typeof vehicleTypeEnum>;
export type EventType = z.infer<typeof eventTypeEnum>;
export type SeatPreference = z.infer<typeof seatPreferenceEnum>;
export type TravelPriority = z.infer<typeof travelPrioritiesEnum>; 