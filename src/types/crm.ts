export interface Client {
  id: string;
  userId: string;
  teamId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  preferredLanguage: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
    travelStyle?: 'luxury' | 'budget' | 'adventure' | 'relaxation' | 'cultural';
    preferredAirlines?: string[];
    preferredHotels?: string[];
    roomPreferences?: string[];
    specialRequests?: string;
  };
  notes?: string;
  status: 'active' | 'inactive' | 'prospect' | 'vip';
  source?: 'referral' | 'website' | 'social_media' | 'cold_call' | 'existing_client' | 'other';
  tags: string[];
  budgetPreference?: {
    min: number;
    max: number;
    currency: string;
  };
  paymentPreference?: 'credit_card' | 'bank_transfer' | 'cash' | 'check';
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
}

export interface ClientInteraction {
  id: string;
  clientId: string;
  userId: string;
  interactionType: 'email' | 'phone' | 'meeting' | 'quote_sent' | 'quote_accepted' | 'quote_declined' | 'follow_up' | 'note';
  subject?: string;
  content?: string;
  outcome?: string;
  nextAction?: string;
  scheduledFollowUp?: string;
  createdAt: string;
}

export interface ClientTravelHistory {
  id: string;
  clientId: string;
  quoteId?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  tripType?: 'leisure' | 'business' | 'honeymoon' | 'family' | 'group' | 'solo' | 'other';
  totalSpent?: number;
  currency: string;
  status: 'planned' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  preferredLanguage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    dietaryRestrictions?: string[];
    accessibilityNeeds?: string[];
    travelStyle?: 'luxury' | 'budget' | 'adventure' | 'relaxation' | 'cultural';
    preferredAirlines?: string[];
    preferredHotels?: string[];
    roomPreferences?: string[];
    specialRequests?: string;
  };
  notes?: string;
  status?: 'active' | 'inactive' | 'prospect' | 'vip';
  source?: 'referral' | 'website' | 'social_media' | 'cold_call' | 'existing_client' | 'other';
  tags?: string[];
  budgetPreference?: {
    min: number;
    max: number;
    currency: string;
  };
  paymentPreference?: 'credit_card' | 'bank_transfer' | 'cash' | 'check';
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
}

export interface CreateInteractionInput {
  clientId: string;
  interactionType: 'email' | 'phone' | 'meeting' | 'quote_sent' | 'quote_accepted' | 'quote_declined' | 'follow_up' | 'note';
  subject?: string;
  content?: string;
  outcome?: string;
  nextAction?: string;
  scheduledFollowUp?: string;
}

export interface CreateTravelHistoryInput {
  clientId: string;
  quoteId?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  tripType?: 'leisure' | 'business' | 'honeymoon' | 'family' | 'group' | 'solo' | 'other';
  totalSpent?: number;
  currency?: string;
  status?: 'planned' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ClientFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'prospect' | 'vip';
  source?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  lastContactBefore?: string;
  lastContactAfter?: string;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  vipClients: number;
  newClientsThisMonth: number;
  clientsWithQuotes: number;
  averageQuotesPerClient: number;
  totalRevenue: number;
  averageRevenuePerClient: number;
} 