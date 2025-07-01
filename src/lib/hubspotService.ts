import { supabase } from './supabase';
import type {
  HubSpotConnection,
  HubSpotContactMapping,
  HubSpotDealMapping,
  HubSpotSyncLog,
  HubSpotSyncSettings,
  HubSpotContact,
  HubSpotDeal,
  HubSpotCompany,
  HubSpotApiResponse,
  HubSpotTokenResponse,
  HubSpotPortalInfo,
  SyncOperation,
  SyncResult,
  HubSpotIntegrationStatus,
  ContactMappingConfig,
  DealMappingConfig
} from '@/types/hubspot';
import type { Client } from '@/types/crm';

export class HubSpotService {
  private static readonly HUBSPOT_API_BASE = 'https://api.hubapi.com';
  private static readonly HUBSPOT_OAUTH_BASE = 'https://app.hubspot.com';

  /**
   * Get HubSpot OAuth URL for team connection
   */
  static getOAuthUrl(teamId: string, state: string): string {
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID || '0ae72dad-c2db-4167-8c98-735e668c56ab';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.custom.read',
      'crm.objects.custom.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'oauth'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state: state
    });

    return `${this.HUBSPOT_OAUTH_BASE}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<HubSpotTokenResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to exchange code for token');
    }

    return result.data;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<HubSpotTokenResponse> {
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID || '0ae72dad-c2db-4167-8c98-735e668c56ab';
    const clientSecret = import.meta.env.VITE_HUBSPOT_CLIENT_SECRET;

    const response = await fetch(`${this.HUBSPOT_OAUTH_BASE}/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Get HubSpot portal information
   */
  static async getPortalInfo(accessToken: string): Promise<HubSpotPortalInfo> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-portal-info`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get portal info: ${error}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get portal info');
    }

    return result.data;
  }

  /**
   * Create or update HubSpot connection for a team
   */
  static async createConnection(
    teamId: string,
    hubspotPortalId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<HubSpotConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get portal info to set account name
    const portalInfo = await this.getPortalInfo(accessToken);

    const { data: connection, error } = await supabase
      .from('hubspot_connections')
      .upsert({
        team_id: teamId,
        hubspot_portal_id: hubspotPortalId,
        hubspot_account_name: portalInfo.name,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        is_active: true,
        sync_enabled: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create HubSpot connection: ${error.message}`);
    }

    return this.transformConnection(connection);
  }

  /**
   * Get HubSpot connection for a team
   */
  static async getConnection(teamId: string): Promise<HubSpotConnection | null> {
    const { data: connection, error } = await supabase
      .from('hubspot_connections')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No connection found
      }
      throw new Error(`Failed to get HubSpot connection: ${error.message}`);
    }

    return this.transformConnection(connection);
  }

  /**
   * Update HubSpot connection
   */
  static async updateConnection(
    connectionId: string,
    updates: Partial<HubSpotConnection>
  ): Promise<HubSpotConnection> {
    const updateData: any = {};
    
    if (updates.syncEnabled !== undefined) updateData.sync_enabled = updates.syncEnabled;
    if (updates.syncFrequency) updateData.sync_frequency = updates.syncFrequency;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.lastSyncAt) updateData.last_sync_at = updates.lastSyncAt;

    const { data: connection, error } = await supabase
      .from('hubspot_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update HubSpot connection: ${error.message}`);
    }

    return this.transformConnection(connection);
  }

  /**
   * Delete HubSpot connection
   */
  static async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('hubspot_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Failed to delete HubSpot connection: ${error.message}`);
    }
  }

  /**
   * Get sync settings for a team
   */
  static async getSyncSettings(teamId: string): Promise<HubSpotSyncSettings | null> {
    const { data: settings, error } = await supabase
      .from('hubspot_sync_settings')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get sync settings: ${error.message}`);
    }

    return this.transformSyncSettings(settings);
  }

  /**
   * Update sync settings
   */
  static async updateSyncSettings(
    teamId: string,
    updates: Partial<HubSpotSyncSettings>
  ): Promise<HubSpotSyncSettings> {
    const updateData: any = {};
    
    if (updates.syncContacts !== undefined) updateData.sync_contacts = updates.syncContacts;
    if (updates.syncDeals !== undefined) updateData.sync_deals = updates.syncDeals;
    if (updates.syncCompanies !== undefined) updateData.sync_companies = updates.syncCompanies;
    if (updates.syncInteractions !== undefined) updateData.sync_interactions = updates.syncInteractions;
    if (updates.syncTravelHistory !== undefined) updateData.sync_travel_history = updates.syncTravelHistory;
    if (updates.autoCreateContacts !== undefined) updateData.auto_create_contacts = updates.autoCreateContacts;
    if (updates.autoCreateDeals !== undefined) updateData.auto_create_deals = updates.autoCreateDeals;
    if (updates.syncDirection) updateData.sync_direction = updates.syncDirection;
    if (updates.contactMapping) updateData.contact_mapping = updates.contactMapping;
    if (updates.dealMapping) updateData.deal_mapping = updates.dealMapping;

    const { data: settings, error } = await supabase
      .from('hubspot_sync_settings')
      .upsert({
        team_id: teamId,
        ...updateData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update sync settings: ${error.message}`);
    }

    return this.transformSyncSettings(settings);
  }

  /**
   * Get HubSpot contacts
   */
  static async getContacts(accessToken: string, limit = 100, after?: string): Promise<HubSpotApiResponse<HubSpotContact>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      properties: 'firstname,lastname,email,phone,company,jobtitle,address,city,state,zip,country,lifecyclestage,lead_status,createdate,lastmodifieddate'
    });

    if (after) {
      params.append('after', after);
    }

    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/contacts?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HubSpot contacts');
    }

    return response.json();
  }

  /**
   * Create HubSpot contact
   */
  static async createContact(accessToken: string, properties: any): Promise<HubSpotContact> {
    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create HubSpot contact: ${error}`);
    }

    return response.json();
  }

  /**
   * Update HubSpot contact
   */
  static async updateContact(accessToken: string, contactId: string, properties: any): Promise<HubSpotContact> {
    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update HubSpot contact: ${error}`);
    }

    return response.json();
  }

  /**
   * Get HubSpot deals
   */
  static async getDeals(accessToken: string, limit = 100, after?: string): Promise<HubSpotApiResponse<HubSpotDeal>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      properties: 'dealname,amount,dealstage,closedate,pipeline,hs_is_closed,hs_is_closed_won,hs_is_closed_lost,hs_deal_stage_probability,hs_createdate,hs_lastmodifieddate'
    });

    if (after) {
      params.append('after', after);
    }

    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/deals?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch HubSpot deals');
    }

    return response.json();
  }

  /**
   * Create HubSpot deal
   */
  static async createDeal(accessToken: string, properties: any, associations?: any): Promise<HubSpotDeal> {
    const payload: any = { properties };
    if (associations) {
      payload.associations = associations;
    }

    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create HubSpot deal: ${error}`);
    }

    return response.json();
  }

  /**
   * Update HubSpot deal
   */
  static async updateDeal(accessToken: string, dealId: string, properties: any): Promise<HubSpotDeal> {
    const response = await fetch(`${this.HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update HubSpot deal: ${error}`);
    }

    return response.json();
  }

  /**
   * Create contact mapping
   */
  static async createContactMapping(
    teamId: string,
    clientId: string,
    hubspotContactId: string
  ): Promise<HubSpotContactMapping> {
    const { data: mapping, error } = await supabase
      .from('hubspot_contact_mappings')
      .insert({
        team_id: teamId,
        client_id: clientId,
        hubspot_contact_id: hubspotContactId,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact mapping: ${error.message}`);
    }

    return this.transformContactMapping(mapping);
  }

  /**
   * Create deal mapping
   */
  static async createDealMapping(
    teamId: string,
    quoteId: string,
    hubspotDealId: string
  ): Promise<HubSpotDealMapping> {
    const { data: mapping, error } = await supabase
      .from('hubspot_deal_mappings')
      .insert({
        team_id: teamId,
        quote_id: quoteId,
        hubspot_deal_id: hubspotDealId,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deal mapping: ${error.message}`);
    }

    return this.transformDealMapping(mapping);
  }

  /**
   * Log sync operation
   */
  static async logSync(
    teamId: string,
    syncType: string,
    status: string,
    recordsProcessed: number,
    recordsSynced: number,
    recordsFailed: number,
    errorMessage?: string
  ): Promise<HubSpotSyncLog> {
    const logData: any = {
      team_id: teamId,
      sync_type: syncType,
      status,
      records_processed: recordsProcessed,
      records_synced: recordsSynced,
      records_failed: recordsFailed,
      started_at: new Date().toISOString()
    };

    if (status === 'completed' || status === 'failed' || status === 'partial') {
      logData.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      logData.error_message = errorMessage;
    }

    const { data: log, error } = await supabase
      .from('hubspot_sync_logs')
      .insert(logData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log sync: ${error.message}`);
    }

    return this.transformSyncLog(log);
  }

  /**
   * Get HubSpot OAuth URL for team connection
   */
  static async getAuthUrl(teamId: string): Promise<string> {
    const state = `${teamId}-${Date.now()}`;
    return this.getOAuthUrl(teamId, state);
  }

  /**
   * Disconnect HubSpot integration for a team
   */
  static async disconnect(teamId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Delete the connection
    const { error } = await supabase
      .from('hubspot_connections')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      throw new Error(`Failed to disconnect HubSpot: ${error.message}`);
    }
  }

  /**
   * Get integration status for the new framework
   */
  static async getIntegrationStatus(teamId: string): Promise<any> {
    try {
      const connection = await this.getConnection(teamId);
      const lastSync = await this.getLastSync(teamId);
      const stats = await this.getSyncStats(teamId);

      if (!connection) {
        return {
          isConnected: false,
          stats: {
            syncedContacts: 0,
            syncedDeals: 0,
            pendingSyncs: 0
          }
        };
      }

      return {
        isConnected: true,
        connection: {
          accountName: connection.hubspotAccountName,
          accountId: connection.hubspotPortalId,
          lastSyncAt: connection.lastSyncAt
        },
        lastSync: lastSync ? {
          status: lastSync.status,
          syncType: lastSync.syncType,
          startedAt: lastSync.startedAt,
          completedAt: lastSync.completedAt,
          recordsProcessed: lastSync.recordsProcessed,
          recordsSynced: lastSync.recordsSynced,
          recordsFailed: lastSync.recordsFailed,
          errorMessage: lastSync.errorMessage
        } : undefined,
        stats: {
          syncedContacts: stats.syncedContacts,
          syncedDeals: stats.syncedDeals,
          pendingSyncs: stats.pendingSyncs,
          totalRecords: stats.totalContacts + stats.totalDeals
        }
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      return {
        isConnected: false,
        stats: {
          syncedContacts: 0,
          syncedDeals: 0,
          pendingSyncs: 0
        }
      };
    }
  }

  /**
   * Get last sync log
   */
  private static async getLastSync(teamId: string): Promise<HubSpotSyncLog | null> {
    const { data: log, error } = await supabase
      .from('hubspot_sync_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get last sync: ${error.message}`);
    }

    return this.transformSyncLog(log);
  }

  /**
   * Get sync statistics
   */
  private static async getSyncStats(teamId: string) {
    const [contactMappings, dealMappings, pendingContacts, pendingDeals] = await Promise.all([
      supabase
        .from('hubspot_contact_mappings')
        .select('sync_status', { count: 'exact' })
        .eq('team_id', teamId),
      supabase
        .from('hubspot_deal_mappings')
        .select('sync_status', { count: 'exact' })
        .eq('team_id', teamId),
      supabase
        .from('hubspot_contact_mappings')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId)
        .eq('sync_status', 'pending'),
      supabase
        .from('hubspot_deal_mappings')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId)
        .eq('sync_status', 'pending')
    ]);

    return {
      totalContacts: contactMappings.count || 0,
      totalDeals: dealMappings.count || 0,
      syncedContacts: (contactMappings.data?.filter(m => m.sync_status === 'synced').length) || 0,
      syncedDeals: (dealMappings.data?.filter(m => m.sync_status === 'synced').length) || 0,
      pendingSyncs: (pendingContacts.count || 0) + (pendingDeals.count || 0)
    };
  }

  // Helper methods to transform database records
  private static transformConnection(connection: any): HubSpotConnection {
    return {
      id: connection.id,
      teamId: connection.team_id,
      hubspotPortalId: connection.hubspot_portal_id,
      hubspotAccountName: connection.hubspot_account_name,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenExpiresAt: connection.token_expires_at,
      isActive: connection.is_active,
      syncEnabled: connection.sync_enabled,
      lastSyncAt: connection.last_sync_at,
      syncFrequency: connection.sync_frequency,
      createdAt: connection.created_at,
      updatedAt: connection.updated_at,
      createdBy: connection.created_by
    };
  }

  private static transformContactMapping(mapping: any): HubSpotContactMapping {
    return {
      id: mapping.id,
      teamId: mapping.team_id,
      clientId: mapping.client_id,
      hubspotContactId: mapping.hubspot_contact_id,
      lastSyncedAt: mapping.last_synced_at,
      syncStatus: mapping.sync_status,
      syncError: mapping.sync_error,
      createdAt: mapping.created_at,
      updatedAt: mapping.updated_at
    };
  }

  private static transformDealMapping(mapping: any): HubSpotDealMapping {
    return {
      id: mapping.id,
      teamId: mapping.team_id,
      quoteId: mapping.quote_id,
      hubspotDealId: mapping.hubspot_deal_id,
      lastSyncedAt: mapping.last_synced_at,
      syncStatus: mapping.sync_status,
      syncError: mapping.sync_error,
      createdAt: mapping.created_at,
      updatedAt: mapping.updated_at
    };
  }

  private static transformSyncLog(log: any): HubSpotSyncLog {
    return {
      id: log.id,
      teamId: log.team_id,
      syncType: log.sync_type,
      status: log.status,
      recordsProcessed: log.records_processed,
      recordsSynced: log.records_synced,
      recordsFailed: log.records_failed,
      errorMessage: log.error_message,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      createdAt: log.created_at
    };
  }

  private static transformSyncSettings(settings: any): HubSpotSyncSettings {
    return {
      id: settings.id,
      teamId: settings.team_id,
      syncContacts: settings.sync_contacts,
      syncDeals: settings.sync_deals,
      syncCompanies: settings.sync_companies,
      syncInteractions: settings.sync_interactions,
      syncTravelHistory: settings.sync_travel_history,
      autoCreateContacts: settings.auto_create_contacts,
      autoCreateDeals: settings.auto_create_deals,
      syncDirection: settings.sync_direction,
      contactMapping: settings.contact_mapping || {},
      dealMapping: settings.deal_mapping || {},
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    };
  }
}

export const hubspotService = HubSpotService; 