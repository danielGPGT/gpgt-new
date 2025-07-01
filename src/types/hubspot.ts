// HubSpot Integration Types

export interface HubSpotConnection {
  id: string;
  teamId: string;
  hubspotPortalId: string;
  hubspotAccountName?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  syncFrequency: 'hourly' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface HubSpotContactMapping {
  id: string;
  teamId: string;
  clientId: string;
  hubspotContactId: string;
  lastSyncedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDealMapping {
  id: string;
  teamId: string;
  quoteId: string;
  hubspotDealId: string;
  lastSyncedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotSyncLog {
  id: string;
  teamId: string;
  syncType: 'contacts' | 'deals' | 'companies' | 'full_sync';
  status: 'started' | 'completed' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface HubSpotSyncSettings {
  id: string;
  teamId: string;
  syncContacts: boolean;
  syncDeals: boolean;
  syncCompanies: boolean;
  syncInteractions: boolean;
  syncTravelHistory: boolean;
  autoCreateContacts: boolean;
  autoCreateDeals: boolean;
  syncDirection: 'to_hubspot' | 'from_hubspot' | 'bidirectional';
  contactMapping: Record<string, string>;
  dealMapping: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// HubSpot API Types
export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    lifecyclestage?: string;
    lead_status?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    hs_is_closed?: string;
    hs_is_closed_won?: string;
    hs_is_closed_lost?: string;
    hs_deal_stage_probability?: string;
    hs_createdate?: string;
    hs_lastmodifieddate?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: { id: string }[];
    companies?: { id: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// HubSpot API Response Types
export interface HubSpotApiResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

export interface HubSpotTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface HubSpotPortalInfo {
  id: number;
  name: string;
  domain: string;
  currency: string;
  timeZone: string;
}

// Sync Operation Types
export interface SyncOperation {
  type: 'contacts' | 'deals' | 'companies' | 'full_sync';
  direction: 'to_hubspot' | 'from_hubspot' | 'bidirectional';
  teamId: string;
  options?: {
    force?: boolean;
    since?: string;
    limit?: number;
  };
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
}

// OAuth Flow Types
export interface HubSpotOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface HubSpotOAuthState {
  teamId: string;
  userId: string;
  state: string;
  timestamp: number;
}

// Mapping Configuration Types
export interface ContactMappingConfig {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  status: string;
  source: string;
  tags: string;
  notes: string;
  budgetPreference: string;
  paymentPreference: string;
}

export interface DealMappingConfig {
  dealName: string;
  amount: string;
  dealStage: string;
  closeDate: string;
  pipeline: string;
  description: string;
  source: string;
  tags: string;
}

// HubSpot Integration Status
export interface HubSpotIntegrationStatus {
  isConnected: boolean;
  connection?: HubSpotConnection;
  lastSync?: HubSpotSyncLog;
  syncSettings?: HubSpotSyncSettings;
  stats: {
    totalContacts: number;
    totalDeals: number;
    syncedContacts: number;
    syncedDeals: number;
    pendingSyncs: number;
  };
}

// Error Types
export interface HubSpotError {
  code: string;
  message: string;
  details?: any;
}

export interface HubSpotSyncError {
  recordId: string;
  recordType: 'contact' | 'deal' | 'company';
  error: string;
  timestamp: string;
} 