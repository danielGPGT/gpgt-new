import { HubSpotService } from './hubspotService';
import { CRMService } from './crmService';
import { supabase } from './supabase';
import type { Client } from '@/types/crm';
import type { HubSpotContact, HubSpotDeal } from '@/types/hubspot';

export class HubSpotSyncService {
  /**
   * Sync clients to HubSpot contacts
   */
  static async syncClientsToHubSpot(teamId: string, connectionId: string): Promise<{
    processed: number;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get HubSpot connection
      const connection = await HubSpotService.getConnection(teamId);
      if (!connection) {
        throw new Error('No HubSpot connection found');
      }

      // Get sync settings
      const syncSettings = await HubSpotService.getSyncSettings(teamId);
      if (!syncSettings?.syncContacts) {
        return result;
      }

      // Get all clients for the team
      const clients = await CRMService.getClients();
      
      for (const client of clients) {
        result.processed++;
        
        try {
          // Check if client is already mapped
          const { data: existingMapping } = await supabase
            .from('hubspot_contact_mappings')
            .select('hubspot_contact_id')
            .eq('team_id', teamId)
            .eq('client_id', client.id)
            .single();

          const contactProperties = this.mapClientToHubSpotContact(client);
          
          if (existingMapping) {
            // Update existing contact
            await HubSpotService.updateContact(
              connection.accessToken,
              existingMapping.hubspot_contact_id,
              contactProperties
            );
          } else {
            // Create new contact
            const hubspotContact = await HubSpotService.createContact(
              connection.accessToken,
              contactProperties
            );
            
            // Create mapping
            await HubSpotService.createContactMapping(
              teamId,
              client.id,
              hubspotContact.id
            );
          }
          
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`Client ${client.id}: ${error.message}`);
        }
      }

      // Log sync operation
      await HubSpotService.logSync(
        teamId,
        'contacts',
        result.failed > 0 ? 'partial' : 'completed',
        result.processed,
        result.synced,
        result.failed,
        result.errors.length > 0 ? result.errors.join('; ') : undefined
      );

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      await HubSpotService.logSync(
        teamId,
        'contacts',
        'failed',
        result.processed,
        result.synced,
        result.failed,
        error.message
      );
    }

    return result;
  }

  /**
   * Sync quotes to HubSpot deals
   */
  static async syncQuotesToHubSpot(teamId: string): Promise<{
    processed: number;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get HubSpot connection
      const connection = await HubSpotService.getConnection(teamId);
      if (!connection) {
        throw new Error('No HubSpot connection found');
      }

      // Get sync settings
      const syncSettings = await HubSpotService.getSyncSettings(teamId);
      if (!syncSettings?.syncDeals) {
        return result;
      }

      // Get all quotes for the team
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', teamId);

      if (!quotes) return result;

      for (const quote of quotes) {
        result.processed++;
        
        try {
          // Check if quote is already mapped
          const { data: existingMapping } = await supabase
            .from('hubspot_deal_mappings')
            .select('hubspot_deal_id')
            .eq('team_id', teamId)
            .eq('quote_id', quote.id)
            .single();

          const dealProperties = this.mapQuoteToHubSpotDeal(quote);
          
          if (existingMapping) {
            // Update existing deal
            await HubSpotService.updateDeal(
              connection.accessToken,
              existingMapping.hubspot_deal_id,
              dealProperties
            );
          } else {
            // Create new deal
            const hubspotDeal = await HubSpotService.createDeal(
              connection.accessToken,
              dealProperties
            );
            
            // Create mapping
            await HubSpotService.createDealMapping(
              teamId,
              quote.id,
              hubspotDeal.id
            );
          }
          
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`Quote ${quote.id}: ${error.message}`);
        }
      }

      // Log sync operation
      await HubSpotService.logSync(
        teamId,
        'deals',
        result.failed > 0 ? 'partial' : 'completed',
        result.processed,
        result.synced,
        result.failed,
        result.errors.length > 0 ? result.errors.join('; ') : undefined
      );

    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
      await HubSpotService.logSync(
        teamId,
        'deals',
        'failed',
        result.processed,
        result.synced,
        result.failed,
        error.message
      );
    }

    return result;
  }

  /**
   * Full sync - contacts and deals
   */
  static async fullSync(teamId: string): Promise<{
    contacts: { processed: number; synced: number; failed: number; errors: string[] };
    deals: { processed: number; synced: number; failed: number; errors: string[] };
  }> {
    const contacts = await this.syncClientsToHubSpot(teamId, '');
    const deals = await this.syncQuotesToHubSpot(teamId);

    return { contacts, deals };
  }

  /**
   * Map client data to HubSpot contact properties
   */
  private static mapClientToHubSpotContact(client: Client): any {
    return {
      firstname: client.firstName,
      lastname: client.lastName,
      email: client.email,
      phone: client.phone,
      company: client.company,
      jobtitle: client.jobTitle,
      lifecyclestage: this.mapClientStatusToLifecycleStage(client.status),
      lead_status: this.mapClientSourceToLeadStatus(client.source),
      address: client.address ? `${client.address.street}, ${client.address.city}, ${client.address.state} ${client.address.zipCode}` : undefined,
      city: client.address?.city,
      state: client.address?.state,
      zip: client.address?.zipCode,
      country: client.address?.country,
      // Custom properties can be added here
      aitinerary_client_id: client.id,
      aitinerary_team_id: client.teamId,
      notes: client.notes,
      tags: client.tags?.join(', '),
      budget_preference: client.budgetPreference ? 
        `${client.budgetPreference.currency} ${client.budgetPreference.min}-${client.budgetPreference.max}` : 
        undefined
    };
  }

  /**
   * Map quote data to HubSpot deal properties
   */
  private static mapQuoteToHubSpotDeal(quote: any): any {
    return {
      dealname: `${quote.client_name} - ${quote.destination}`,
      amount: quote.total_price?.toString(),
      dealstage: this.mapQuoteStatusToDealStage(quote.status),
      closedate: quote.end_date,
      pipeline: 'default',
      description: `Trip to ${quote.destination} from ${quote.start_date} to ${quote.end_date}`,
      // Custom properties
      aitinerary_quote_id: quote.id,
      destination: quote.destination,
      start_date: quote.start_date,
      end_date: quote.end_date,
      travelers: JSON.stringify(quote.travelers),
      currency: quote.currency,
      agent_margin: quote.agent_margin?.toString()
    };
  }

  /**
   * Map client status to HubSpot lifecycle stage
   */
  private static mapClientStatusToLifecycleStage(status: string): string {
    switch (status) {
      case 'prospect':
        return 'lead';
      case 'active':
        return 'customer';
      case 'vip':
        return 'customer';
      case 'inactive':
        return 'unqualified';
      default:
        return 'lead';
    }
  }

  /**
   * Map client source to HubSpot lead status
   */
  private static mapClientSourceToLeadStatus(source?: string): string {
    switch (source) {
      case 'website':
        return 'NEW';
      case 'referral':
        return 'NEW';
      case 'social_media':
        return 'NEW';
      case 'cold_call':
        return 'NEW';
      case 'existing_client':
        return 'CONNECTED';
      default:
        return 'NEW';
    }
  }

  /**
   * Map quote status to HubSpot deal stage
   */
  private static mapQuoteStatusToDealStage(status: string): string {
    switch (status) {
      case 'draft':
        return 'appointmentscheduled';
      case 'sent':
        return 'qualifiedtobuy';
      case 'accepted':
        return 'closedwon';
      case 'declined':
        return 'closedlost';
      case 'expired':
        return 'closedlost';
      default:
        return 'appointmentscheduled';
    }
  }

  /**
   * Refresh expired access tokens
   */
  static async refreshExpiredTokens(): Promise<void> {
    try {
      const { data: connections } = await supabase
        .from('hubspot_connections')
        .select('*')
        .eq('is_active', true)
        .lt('token_expires_at', new Date().toISOString());

      if (!connections) return;

      for (const connection of connections) {
        try {
          if (!connection.refresh_token) continue;

          const tokenResponse = await HubSpotService.refreshToken(connection.refresh_token);
          
          // Update connection with new tokens
          await HubSpotService.updateConnection(connection.id, {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          });
        } catch (error) {
          console.error(`Failed to refresh token for connection ${connection.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to refresh expired tokens:', error);
    }
  }

  /**
   * Get sync statistics for a team
   */
  static async getSyncStats(teamId: string): Promise<{
    lastSync: string | null;
    totalContacts: number;
    totalDeals: number;
    syncedContacts: number;
    syncedDeals: number;
    pendingSyncs: number;
  }> {
    try {
      const [lastSync, contactMappings, dealMappings, pendingContacts, pendingDeals] = await Promise.all([
        supabase
          .from('hubspot_sync_logs')
          .select('started_at')
          .eq('team_id', teamId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single(),
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
        lastSync: lastSync?.data?.started_at || null,
        totalContacts: contactMappings.count || 0,
        totalDeals: dealMappings.count || 0,
        syncedContacts: (contactMappings.data?.filter(m => m.sync_status === 'synced').length) || 0,
        syncedDeals: (dealMappings.data?.filter(m => m.sync_status === 'synced').length) || 0,
        pendingSyncs: (pendingContacts.count || 0) + (pendingDeals.count || 0)
      };
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return {
        lastSync: null,
        totalContacts: 0,
        totalDeals: 0,
        syncedContacts: 0,
        syncedDeals: 0,
        pendingSyncs: 0
      };
    }
  }
}

export const hubspotSyncService = HubSpotSyncService; 