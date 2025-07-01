import { z } from 'zod';

// Base schemas for package components
export const destinationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Destination name is required'),
  country: z.string().optional(),
  stayLength: z.number().min(1, 'Stay length must be at least 1 night'),
  hotel: z.object({
    type: z.enum(['api', 'manual']),
    apiHotel: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      stars: z.number().optional(),
      amenities: z.array(z.string()).optional(),
      imageUrl: z.string().optional(),
    }).optional(),
    manualHotel: z.object({
      name: z.string().min(1, 'Hotel name is required'),
      stars: z.number().min(1).max(5),
      imageUrl: z.string().url().optional(),
      amenities: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const flightSchema = z.object({
  enabled: z.boolean().default(false),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  airlinePreference: z.string().optional(),
  estimatedCost: z.number().optional(),
  quoteSeparately: z.boolean().default(false),
  notes: z.string().optional(),
});

export const transferSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['arrival', 'inter_city', 'departure']),
  fromLocation: z.string(),
  toLocation: z.string(),
  vehicle: z.string(),
  notes: z.string().optional(),
  estimatedCost: z.number().optional(),
});

export const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Event name is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  cost: z.number().optional(),
  isAddOn: z.boolean().default(false),
  addOnOptions: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

export const pricingSchema = z.object({
  basePrice: z.number().min(0, 'Base price must be positive'),
  currency: z.string().default('GBP'),
  pricingType: z.enum(['per_person', 'per_group', 'dynamic']).default('per_person'),
  marginType: z.enum(['percentage', 'fixed']).default('percentage'),
  marginValue: z.number().min(0).default(0.15),
  internalNotes: z.string().optional(),
});

// Main package schema
export const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  minTravelers: z.number().min(1).default(1),
  maxTravelers: z.number().optional(),
  isPublic: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  
  // Package content
  destinations: z.array(destinationSchema).min(1, 'At least one destination is required'),
  flights: flightSchema.optional(),
  transfers: z.array(transferSchema).default([]),
  events: z.array(eventSchema).default([]),
  itineraryText: z.string().optional(),
  
  // Pricing
  pricing: pricingSchema,
  
  // Metadata
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.string().default('1.0'),
});

// TypeScript types
export type Destination = z.infer<typeof destinationSchema>;
export type Flight = z.infer<typeof flightSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Pricing = z.infer<typeof pricingSchema>;
export type Package = z.infer<typeof packageSchema>;

// Database types for Supabase
export interface DatabasePackage {
  id: string;
  user_id: string;
  team_id?: string;
  name: string;
  description?: string;
  tags: string[];
  duration_days: number;
  min_travelers: number;
  max_travelers?: number;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
  destinations: Destination[];
  flights?: Flight;
  transfers: Transfer[];
  events: Event[];
  itinerary_text?: string;
  base_price?: number;
  currency: string;
  pricing_type: 'per_person' | 'per_group' | 'dynamic';
  margin_type: 'percentage' | 'fixed';
  margin_value: number;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  version: string;
}

// Package builder step types
export type PackageBuilderStep = 
  | 'overview'
  | 'destinations'
  | 'flights'
  | 'transfers'
  | 'events'
  | 'pricing'
  | 'review';

export interface PackageBuilderState {
  currentStep: PackageBuilderStep;
  package: Package;
  isSubmitting: boolean;
  isGeneratingAI: boolean;
}

// Package filter and search types
export interface PackageFilters {
  tags?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
  travelers?: {
    min?: number;
    max?: number;
  };
  status?: 'draft' | 'published' | 'archived';
  isPublic?: boolean;
}

// Package usage types
export interface PackageUsage {
  packageId: string;
  quoteId?: string;
  clientId?: string;
  usedAt: string;
  modifiedData?: Partial<Package>;
} 