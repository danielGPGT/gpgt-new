export interface User {
  id: string;
  email: string;
  name: string;
  agencyName?: string;
  logo?: string;
}

export interface TripPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  tone: 'luxury' | 'playful' | 'romantic' | 'adventure';
  travelType: 'solo' | 'couple' | 'group';
  budget: 'luxury' | 'premium' | 'standard';
  clientName: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time?: string;
  location?: string;
  cost?: string;
  image?: string;
}

export interface Day {
  id: string;
  dayNumber: number;
  title: string;
  narrative: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  title: string;
  clientName: string;
  destination: string;
  generatedBy: string;
  dateCreated: string;
  preferences: TripPreferences;
  days: Day[];
}

export interface Store {
  currentUser: User | null;
  currentItinerary: Itinerary | null;
  savedItineraries: Itinerary[];
  setCurrentUser: (user: User | null) => void;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;
  addSavedItinerary: (itinerary: Itinerary) => void;
  removeSavedItinerary: (id: string) => void;
}

// Updated Quote types to match the clean database schema
export interface Quote {
  id: string;
  userId: string;
  clientId?: string;
  teamId?: string;
  consultantId?: string;
  team?: {
    id: string;
    name: string;
    logo_url?: string;
    agency_name?: string;
  };
  
  // Client Information
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Event Information
  eventId?: string;
  eventName?: string;
  eventLocation?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  
  // Package Information
  packageId?: string;
  packageName?: string;
  packageBaseType?: string;
  tierId?: string;
  tierName?: string;
  tierDescription?: string;
  tierPriceOverride?: number;
  
  // Travel Information
  travelers: {
    adults: number;
    children: number;
    total: number;
  };
  travelersAdults: number;
  travelersChildren: number;
  travelersTotal: number;
  
  // Pricing Information
  totalPrice?: number;
  currency: string;
  baseCost?: number;
  
  // Payment Schedule
  paymentDeposit: number;
  paymentSecondPayment: number;
  paymentFinalPayment: number;
  paymentDepositDate?: string;
  paymentSecondPaymentDate?: string;
  paymentFinalPaymentDate?: string;
  
  // Quote Details
  quoteNumber?: string;
  quoteReference?: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'confirmed' | 'cancelled';
  version: number;
  isRevision: boolean;
  parentQuoteId?: string;
  
  // Component Data (JSONB)
  selectedComponents?: any;
  selectedPackage?: any;
  selectedTier?: any;
  priceBreakdown?: any;
  
  // Additional Data
  internalNotes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
}

// Quote creation data interface
export interface CreateQuoteData {
  clientId?: string;
  clientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  travelersData: {
    adults: number;
    children: number;
    total: number;
  };
  eventData: {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  packageData: {
    id: string;
    name: string;
    baseType: string;
    tierId: string;
    tierName: string;
    tierDescription?: string;
    tierPriceOverride?: number;
  };
  componentsData: {
    tickets: any[];
    hotels: any[];
    circuitTransfers: any[];
    airportTransfers: any[];
    flights: any[];
    loungePass?: any;
  };
  paymentsData: {
    total: number;
    currency: string;
    deposit: number;
    secondPayment: number;
    finalPayment: number;
    depositDate?: string;
    secondPaymentDate?: string;
    finalPaymentDate?: string;
  };
  internalNotes?: string;
  consultantId?: string;
}

// Quote response interface for API responses
export interface QuoteResponse {
  id: string;
  status: Quote['status'];
  totalPrice: number;
  currency: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  eventName?: string;
  eventLocation?: string;
  packageName?: string;
  tierName?: string;
  travelersAdults: number;
  travelersChildren: number;
  travelersTotal: number;
  paymentDeposit: number;
  paymentSecondPayment: number;
  paymentFinalPayment: number;
  quoteNumber?: string;
  createdAt: string;
  updatedAt: string;
  selectedComponents?: any;
  selectedPackage?: any;
  selectedTier?: any;
  priceBreakdown?: any;
}

// Quote error interface
export interface QuoteError {
  message: string;
  code: string;
}

// Quote component interface (for future use if needed)
export interface QuoteComponent {
  id: string;
  quoteId: string;
  componentType: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass';
  componentId?: string;
  componentData: any;
  componentName?: string;
  componentDescription?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  sortOrder: number;
  isOptional: boolean;
  isIncluded: boolean;
  createdAt: string;
}

// Quote activity interface (for future use if needed)
export interface QuoteActivity {
  id: string;
  activityType: string;
  activityDescription: string;
  performedBy?: string;
  performedAt: string;
  metadata?: any;
}

// Quote email interface (for future use if needed)
export interface QuoteEmail {
  id: string;
  emailType: string;
  recipientEmail: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  bounced: boolean;
  metadata?: any;
}

// Quote attachment interface (for future use if needed)
export interface QuoteAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  attachmentType: string;
  createdAt: string;
}

// Quote details interface (for future use if needed)
export interface QuoteDetails {
  quote: Quote;
  activities: QuoteActivity[];
  emails: QuoteEmail[];
  attachments: QuoteAttachment[];
} 