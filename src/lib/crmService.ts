import { supabase } from './supabase';
import type { 
  Client, 
  ClientInteraction, 
  ClientTravelHistory,
  CreateClientInput, 
  UpdateClientInput,
  CreateInteractionInput,
  CreateTravelHistoryInput,
  ClientFilters,
  ClientStats
} from '@/types/crm';

export class CRMService {
  /**
   * Create a new client
   */
  static async createClient(clientData: CreateClientInput): Promise<Client> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's team if they're part of one
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          team_id: teamMember?.team_id || null,
          first_name: clientData.firstName,
          last_name: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          company: clientData.company,
          job_title: clientData.jobTitle,
          ...(clientData.dateOfBirth && clientData.dateOfBirth !== '' && { date_of_birth: clientData.dateOfBirth }),
          passport_number: clientData.passportNumber,
          nationality: clientData.nationality,
          preferred_language: clientData.preferredLanguage || 'English',
          address: clientData.address,
          preferences: clientData.preferences,
          notes: clientData.notes,
          status: clientData.status || 'active',
          source: clientData.source,
          tags: clientData.tags || [],
          budget_preference: clientData.budgetPreference,
          payment_preference: clientData.paymentPreference,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create client: ${error.message}`);
      }

      return this.transformClient(client);
    } catch (error) {
      console.error('Create client error:', error);
      throw error;
    }
  }

  /**
   * Get all clients with optional filtering
   */
  static async getClients(filters?: ClientFilters): Promise<Client[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.hasEmail) {
        query = query.not('email', 'is', null);
      }

      if (filters?.hasPhone) {
        query = query.not('phone', 'is', null);
      }

      if (filters?.lastContactBefore) {
        query = query.lte('last_contact_at', filters.lastContactBefore);
      }

      if (filters?.lastContactAfter) {
        query = query.gte('last_contact_at', filters.lastContactAfter);
      }

      const { data: clients, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch clients: ${error.message}`);
      }

      return clients.map(client => this.transformClient(client));
    } catch (error) {
      console.error('Get clients error:', error);
      throw error;
    }
  }

  /**
   * Get a specific client by ID
   */
  static async getClientById(clientId: string): Promise<Client> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch client: ${error.message}`);
      }

      if (!client) {
        throw new Error('Client not found');
      }

      return this.transformClient(client);
    } catch (error) {
      console.error('Get client error:', error);
      throw error;
    }
  }

  /**
   * Update a client
   */
  static async updateClient(clientData: UpdateClientInput): Promise<Client> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {};
      
      if (clientData.firstName) updateData.first_name = clientData.firstName;
      if (clientData.lastName) updateData.last_name = clientData.lastName;
      if (clientData.email !== undefined) updateData.email = clientData.email;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone;
      if (clientData.company !== undefined) updateData.company = clientData.company;
      if (clientData.jobTitle !== undefined) updateData.job_title = clientData.jobTitle;
      if (clientData.dateOfBirth !== undefined && clientData.dateOfBirth !== '') updateData.date_of_birth = clientData.dateOfBirth;
      if (clientData.passportNumber !== undefined) updateData.passport_number = clientData.passportNumber;
      if (clientData.nationality !== undefined) updateData.nationality = clientData.nationality;
      if (clientData.preferredLanguage) updateData.preferred_language = clientData.preferredLanguage;
      if (clientData.address !== undefined) updateData.address = clientData.address;
      if (clientData.preferences !== undefined) updateData.preferences = clientData.preferences;
      if (clientData.notes !== undefined) updateData.notes = clientData.notes;
      if (clientData.status) updateData.status = clientData.status;
      if (clientData.source !== undefined) updateData.source = clientData.source;
      if (clientData.tags) updateData.tags = clientData.tags;
      if (clientData.budgetPreference !== undefined) updateData.budget_preference = clientData.budgetPreference;
      if (clientData.paymentPreference) updateData.payment_preference = clientData.paymentPreference;

      const { data: client, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientData.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update client: ${error.message}`);
      }

      return this.transformClient(client);
    } catch (error) {
      console.error('Update client error:', error);
      throw error;
    }
  }

  /**
   * Delete a client
   */
  static async deleteClient(clientId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        throw new Error(`Failed to delete client: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete client error:', error);
      throw error;
    }
  }

  /**
   * Create a client interaction
   */
  static async createInteraction(interactionData: CreateInteractionInput): Promise<ClientInteraction> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: interaction, error } = await supabase
        .from('client_interactions')
        .insert({
          client_id: interactionData.clientId,
          user_id: user.id,
          interaction_type: interactionData.interactionType,
          subject: interactionData.subject,
          content: interactionData.content,
          outcome: interactionData.outcome,
          next_action: interactionData.nextAction,
          scheduled_follow_up: interactionData.scheduledFollowUp,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create interaction: ${error.message}`);
      }

      return this.transformInteraction(interaction);
    } catch (error) {
      console.error('Create interaction error:', error);
      throw error;
    }
  }

  /**
   * Get interactions for a client
   */
  static async getClientInteractions(clientId: string): Promise<ClientInteraction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: interactions, error } = await supabase
        .from('client_interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch client interactions: ${error.message}`);
      }

      return interactions.map(interaction => this.transformInteraction(interaction));
    } catch (error) {
      console.error('Get client interactions error:', error);
      throw error;
    }
  }

  /**
   * Create travel history entry
   */
  static async createTravelHistory(travelData: CreateTravelHistoryInput): Promise<ClientTravelHistory> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: travelHistory, error } = await supabase
        .from('client_travel_history')
        .insert({
          client_id: travelData.clientId,
          quote_id: travelData.quoteId,
          destination: travelData.destination,
          start_date: travelData.startDate,
          end_date: travelData.endDate,
          trip_type: travelData.tripType,
          total_spent: travelData.totalSpent,
          currency: travelData.currency || 'USD',
          status: travelData.status || 'completed',
          notes: travelData.notes,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create travel history: ${error.message}`);
      }

      return this.transformTravelHistory(travelHistory);
    } catch (error) {
      console.error('Create travel history error:', error);
      throw error;
    }
  }

  /**
   * Get travel history for a client
   */
  static async getClientTravelHistory(clientId: string): Promise<ClientTravelHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: travelHistory, error } = await supabase
        .from('client_travel_history')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch travel history: ${error.message}`);
      }

      return travelHistory.map(history => this.transformTravelHistory(history));
    } catch (error) {
      console.error('Get travel history error:', error);
      throw error;
    }
  }

  /**
   * Get client statistics
   */
  static async getClientStats(): Promise<ClientStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get basic client counts
      const { data: clients } = await supabase
        .from('clients')
        .select('status, created_at');

      // Get quotes data
      const { data: quotes } = await supabase
        .from('quotes')
        .select('client_id, total_price, currency');

      // Calculate stats
      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const prospectClients = clients?.filter(c => c.status === 'prospect').length || 0;
      const vipClients = clients?.filter(c => c.status === 'vip').length || 0;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newClientsThisMonth = clients?.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length || 0;

      const clientsWithQuotes = new Set(quotes?.map(q => q.client_id)).size;
      const averageQuotesPerClient = quotes?.length ? (quotes.length / totalClients) : 0;

      const totalRevenue = quotes?.reduce((sum, q) => sum + (q.total_price || 0), 0) || 0;
      const averageRevenuePerClient = totalClients > 0 ? (totalRevenue / totalClients) : 0;

      return {
        totalClients,
        activeClients,
        prospectClients,
        vipClients,
        newClientsThisMonth,
        clientsWithQuotes,
        averageQuotesPerClient,
        totalRevenue,
        averageRevenuePerClient,
      };
    } catch (error) {
      console.error('Get client stats error:', error);
      throw error;
    }
  }

  /**
   * Search clients by name or email
   */
  static async searchClients(query: string): Promise<Client[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('first_name', { ascending: true })
        .limit(10);

      if (error) {
        throw new Error(`Failed to search clients: ${error.message}`);
      }

      return clients.map(client => this.transformClient(client));
    } catch (error) {
      console.error('Search clients error:', error);
      throw error;
    }
  }

  /**
   * Get client quotes
   */
  static async getClientQuotes(clientId: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch client quotes:', error);
        return [];
      }

      return quotes || [];
    } catch (error) {
      console.error('Get client quotes error:', error);
      return [];
    }
  }

  /**
   * Get client bookings
   */
  static async getClientBookings(clientId: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch client bookings:', error);
        return [];
      }

      return bookings || [];
    } catch (error) {
      console.error('Get client bookings error:', error);
      return [];
    }
  }

  /**
   * Get client notes
   */
  static async getClientNotes(clientId: string): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: notes, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch client notes:', error);
        return [];
      }

      return notes || [];
    } catch (error) {
      console.error('Get client notes error:', error);
      return [];
    }
  }

  // Helper methods to transform database records to TypeScript interfaces
  private static transformClient(client: any): Client {
    return {
      id: client.id,
      userId: client.user_id,
      teamId: client.team_id,
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      jobTitle: client.job_title,
      dateOfBirth: client.date_of_birth,
      passportNumber: client.passport_number,
      nationality: client.nationality,
      preferredLanguage: client.preferred_language,
      address: client.address,
      preferences: client.preferences,
      notes: client.notes,
      status: client.status,
      source: client.source,
      tags: client.tags || [],
      budgetPreference: client.budget_preference,
      paymentPreference: client.payment_preference,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      lastContactAt: client.last_contact_at,
    };
  }

  private static transformInteraction(interaction: any): ClientInteraction {
    return {
      id: interaction.id,
      clientId: interaction.client_id,
      userId: interaction.user_id,
      interactionType: interaction.interaction_type,
      subject: interaction.subject,
      content: interaction.content,
      outcome: interaction.outcome,
      nextAction: interaction.next_action,
      scheduledFollowUp: interaction.scheduled_follow_up,
      createdAt: interaction.created_at,
    };
  }

  private static transformTravelHistory(history: any): ClientTravelHistory {
    return {
      id: history.id,
      clientId: history.client_id,
      quoteId: history.quote_id,
      destination: history.destination,
      startDate: history.start_date,
      endDate: history.end_date,
      tripType: history.trip_type,
      totalSpent: history.total_spent,
      currency: history.currency,
      status: history.status,
      notes: history.notes,
      createdAt: history.created_at,
    };
  }
}

export const crmService = CRMService; 