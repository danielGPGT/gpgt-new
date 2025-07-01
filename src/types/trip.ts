import { z } from 'zod';

export const travelTypeEnum = z.enum(['solo', 'couple', 'family', 'group']);
export const transportTypeEnum = z.enum(['plane', 'train', 'car', 'ship']);
export const toneEnum = z.enum(['romantic', 'luxury', 'wellness', 'cultural', 'adventure', 'celebration']);
export const paceEnum = z.enum(['relaxed', 'balanced', 'packed']);
export const accommodationEnum = z.enum(['boutique', 'resort', 'villa', 'eco']);
export const travelClassEnum = z.enum(['economy', 'business', 'first']);
export const experienceTypeEnum = z.enum(['exclusive', 'value']);

export const interestsEnum = z.enum([
  'fine-dining',
  'wine',
  'art',
  'history',
  'nature',
  'shopping',
  'beaches',
  'nightlife',
  'sports',
  'spa',
  'local-culture'
]);

export const flightFiltersSchema = z.object({
  preferredAirlines: z.array(z.string()).optional(),
  nonstopOnly: z.boolean().optional(),
  departureTimeRange: z.tuple([z.string(), z.string()]).optional(),
});

export const hotelFiltersSchema = z.object({
  minStarRating: z.number().optional(),
  roomType: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export const eventFiltersSchema = z.object({
  types: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
});

// RateHawk Hotel Selection Types
export const rateHawkHotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  stars: z.number(),
  address: z.object({
    country: z.string(),
    city: z.string(),
    street: z.string(),
    zip: z.string(),
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  images: z.array(z.string()),
  amenities: z.array(z.string()),
  description: z.string().optional(),
});

export const rateHawkRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  capacity: z.object({
    adults: z.number(),
    children: z.number(),
  }),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
    originalAmount: z.number().optional(),
  }),
  cancellationPolicy: z.string().optional(),
  boardType: z.string().optional(),
  refundable: z.boolean(),
  available: z.boolean(),
  roomGroupId: z.number().optional(),
  images: z.array(z.string()).optional(),
});

export const selectedHotelSchema = z.object({
  hotel: rateHawkHotelSchema,
  room: rateHawkRoomSchema,
  selectedAt: z.string(),
});

export const agentContextSchema = z.object({
  agentId: z.string(),
  marginOverride: z.number().optional(),
});

// Package Components Types
export const packageComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['outboundFlight', 'inboundFlight', 'hotel', 'event', 'transfer', 'activity', 'insurance']),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  rating: z.number().optional(),
  image: z.string().optional(),
  data: z.any(),
  aiReasoning: z.string(),
  selected: z.boolean(),
});

export const packageBundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  totalPrice: z.number(),
  currency: z.string(),
  savings: z.number(),
  components: z.array(packageComponentSchema),
  aiSummary: z.string(),
  selected: z.boolean(),
});

export interface TravelerComponent {
  id: string;
  type: 'flight' | 'hotel' | 'transfer' | 'event' | 'activity' | 'insurance';
  travelerIds: string[]; // Which travelers this component applies to
  componentData: any; // The actual component data (flight, hotel, etc.)
  pricing: {
    basePrice: number;
    markup: number;
    totalPrice: number;
    currency: string;
    perTraveler: number; // Price per traveler (for shared components)
  };
  status: 'selected' | 'alternative' | 'rejected';
  notes?: string;
}

export interface GroupQuote {
  id: string;
  groupId: string;
  travelers: IndividualTraveler[];
  components: TravelerComponent[];
  tripInfo: {
    destination: string;
    startDate: string;
    endDate: string;
    duration: number;
  };
  pricing: {
    totalGroupCost: number;
    costPerTraveler: Record<string, number>; // travelerId -> total cost
    currency: string;
    markup: number;
    commission: number;
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  expiresAt: string;
}

export interface ComponentAssignment {
  componentId: string;
  travelerIds: string[];
  pricing: {
    basePrice: number;
    markup: number;
    totalPrice: number;
    perTraveler: number;
  };
}

// Enhanced package components schema to support per-traveler assignments
export const packageComponentsSchema = z.object({
  components: z.array(z.object({
    id: z.string(),
    type: z.enum(['flight', 'hotel', 'transfer', 'event', 'activity', 'insurance']),
    title: z.string(),
    description: z.string(),
    price: z.number(),
    currency: z.string(),
    rating: z.number().optional(),
    image: z.string().optional(),
    data: z.any(),
    selected: z.boolean(),
    isSmartRecommendation: z.boolean(),
    aiReasoning: z.string().optional(),
    dates: z.string().optional(),
    duration: z.string().optional(),
    capacity: z.number().optional(),
    amenities: z.array(z.string()).optional(),
    // New: Per-traveler assignment
    travelerAssignments: z.array(z.object({
      travelerId: z.string(),
      assigned: z.boolean(),
      customPrice: z.number().optional(),
      notes: z.string().optional(),
    })).optional(),
    // New: Component-specific pricing
    componentPricing: z.object({
      basePrice: z.number(),
      markup: z.number(),
      totalPrice: z.number(),
      perTraveler: z.number(),
      currency: z.string(),
    }).optional(),
  })),
  // New: Group-level summary
  groupSummary: z.object({
    totalTravelers: z.number(),
    totalCost: z.number(),
    costPerTraveler: z.record(z.string(), z.number()), // travelerId -> cost
    currency: z.string(),
    markup: z.number(),
    commission: z.number(),
  }).optional(),
});

export interface IndividualTraveler {
  id: string;
  name: string;
  type: 'adult' | 'child';
  age?: number;
  preferences: {
    flightClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    hotelRoom?: 'shared' | 'single' | 'suite';
    transferType?: 'shared' | 'private';
    specialNeeds?: string[];
    dietaryRestrictions?: string[];
  };
  groupAssignments: {
    flightGroup?: string; // Group ID for shared flights
    hotelGroup?: string;  // Group ID for shared rooms
    transferGroup?: string; // Group ID for shared transfers
  };
}

export interface TravelerGroup {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'transfer';
  travelers: string[]; // Array of traveler IDs
  preferences: {
    flightClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    hotelRoomType?: 'standard' | 'deluxe' | 'suite' | 'connecting';
    transferVehicle?: 'sedan' | 'suv' | 'minivan' | 'bus';
    sharedPreferences?: string[];
  };
}

export interface GroupBookingScenario {
  travelers: IndividualTraveler[];
  groups: TravelerGroup[];
  sharedPreferences: {
    destination: string;
    dates: {
      arrival: string;
      departure: string;
    };
    budget: {
      total: number;
      currency: string;
      allocation: {
        flights: number; // percentage
        hotels: number;  // percentage
        transfers: number; // percentage
        activities: number; // percentage
      };
    };
  };
}

// Update the existing tripIntakeSchema to include enhanced group booking
export const tripIntakeSchema = z.object({
  // CRM Integration
  clientId: z.string().optional(),

  // Step 1: Traveler Overview
  travelerInfo: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    address: z.object({
      street: z.string().default(''),
      city: z.string().default(''),
      state: z.string().default(''),
      zipCode: z.string().default(''),
      country: z.string().default(''),
    }),
    travelType: travelTypeEnum,
    transportType: transportTypeEnum,
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    travelers: z.object({
      adults: z.number().min(1, 'At least one adult is required'),
      children: z.number().min(0).default(0),
    }),
    // Enhanced: Individual traveler details for group bookings
    individualTravelers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['adult', 'child']),
      age: z.number().optional(),
      preferences: z.object({
        flightClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
        hotelRoom: z.enum(['shared', 'single', 'suite']).optional(),
        transferType: z.enum(['shared', 'private']).optional(),
        specialNeeds: z.array(z.string()).optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
        departureAirport: z.string().optional(), // For different origins
        arrivalAirport: z.string().optional(),
      }).optional(),
      groupAssignments: z.object({
        flightGroup: z.string().optional(),
        hotelGroup: z.string().optional(),
        transferGroup: z.string().optional(),
        eventGroup: z.string().optional(),
      }).optional(),
      // New: Per-traveler pricing and status
      pricing: z.object({
        totalCost: z.number().default(0),
        components: z.array(z.string()).default([]), // Component IDs assigned to this traveler
        markup: z.number().default(0),
        commission: z.number().default(0),
      }).optional(),
    })).optional(),
    // Enhanced: Traveler groups for shared bookings
    travelerGroups: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['flight', 'hotel', 'transfer', 'event']),
      travelers: z.array(z.string()),
      preferences: z.object({
        flightClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
        hotelRoomType: z.enum(['standard', 'deluxe', 'suite', 'connecting']).optional(),
        transferVehicle: z.enum(['sedan', 'suv', 'minivan', 'bus']).optional(),
        sharedPreferences: z.array(z.string()).optional(),
        departureAirport: z.string().optional(),
        arrivalAirport: z.string().optional(),
      }).optional(),
      // New: Group-specific pricing
      pricing: z.object({
        basePrice: z.number().default(0),
        markup: z.number().default(0),
        totalPrice: z.number().default(0),
        perTraveler: z.number().default(0),
        currency: z.string().default('GBP'),
      }).optional(),
    })).optional(),
  }),

  // Step 2: Destination Preferences
  destinations: z.object({
    from: z.string().min(2, 'From location is required'),
    primary: z.string().min(2, 'Primary destination is required'),
    additional: z.array(z.string()).default([]),
    duration: z.number().default(0),
    outboundFlight: z.object({
      from: z.string().min(2, 'Outbound departure airport is required'),
      to: z.string().min(2, 'Outbound arrival airport is required'),
      date: z.string().min(1, 'Outbound date is required'),
    }).optional(),
    inboundFlight: z.object({
      from: z.string().min(2, 'Inbound departure airport is required'),
      to: z.string().min(2, 'Inbound arrival airport is required'),
      date: z.string().min(1, 'Inbound date is required'),
    }).optional(),
  }),

  // Step 3: Trip Style
  style: z.object({
    tone: toneEnum,
    interests: z.array(interestsEnum).min(1, 'Select at least one interest'),
  }),

  // Step 4: Experience Preferences
  experience: z.object({
    pace: paceEnum,
    accommodation: accommodationEnum,
    specialRequests: z.string().optional(),
  }),

  // Step 5: Budget
  budget: z.object({
    amount: z.number().min(1, 'Budget amount is required'),
    currency: z.string().min(3, 'Currency is required'),
    experienceType: experienceTypeEnum,
    travelClass: travelClassEnum,
  }),

  // Step 6: Package Components
  packageComponents: packageComponentsSchema.optional(),

  // Step 7: Events
  eventRequests: z.string().default(''),
  eventTypes: z.array(z.string()).default([]),

  // Step 8: Inventory (updated structure)
  includeInventory: z.object({
    flights: z.boolean(),
    hotels: z.boolean(),
    events: z.boolean(),
  }),
  flightFilters: flightFiltersSchema.optional(),
  hotelFilters: hotelFiltersSchema.optional(),
  eventFilters: eventFiltersSchema.optional(),

  // Agent context
  agentContext: agentContextSchema.optional(),
});

export type TripIntake = z.infer<typeof tripIntakeSchema>;
export type FlightFilters = z.infer<typeof flightFiltersSchema>;
export type HotelFilters = z.infer<typeof hotelFiltersSchema>;
export type EventFilters = z.infer<typeof eventFiltersSchema>;
export type AgentContext = z.infer<typeof agentContextSchema>;
export type RateHawkHotel = z.infer<typeof rateHawkHotelSchema>;
export type RateHawkRoom = z.infer<typeof rateHawkRoomSchema>;
export type SelectedHotel = z.infer<typeof selectedHotelSchema>;
export type PackageComponent = z.infer<typeof packageComponentSchema>;
export type PackageBundle = z.infer<typeof packageBundleSchema>;
export type PackageComponents = z.infer<typeof packageComponentsSchema>; 