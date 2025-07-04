import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { gemini } from './gemini';
import type { TripPreferences, GeneratedItinerary } from './gemini';
import { supabase } from './supabase';
import type { TripIntake } from '@/types/trip';
import { tierManager } from './tierManager';
import { getCurrentUserTeamId, ensureUserHasTeam } from './teamUtils';

export interface SavedItinerary {
  id: string;
  title: string;
  client_name: string;
  destination: string;
  generated_by: string;
  date_created: string;
  preferences: TripIntake;
  days: GeneratedItinerary['days'];
  created_at: string;
  updated_at: string;
  team_id?: string;
}

export class ItineraryService {
  private supabase = supabase;

  async generateItinerary(preferences: TripPreferences, userId: string): Promise<SavedItinerary> {
    try {
      // Check if user can create more itineraries
      if (!tierManager.canCreateItinerary()) {
        throw new Error(tierManager.getLimitReachedMessage('itineraries'));
      }

      // Ensure user has a team
      await ensureUserHasTeam();

      // Generate itinerary using Gemini
      const generated = await gemini.generateItinerary(preferences);

      // Get current timestamp in ISO format
      const now = new Date().toISOString();

      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      // Save to Supabase
      const { data, error } = await this.supabase
        .from('itineraries')
        .insert({
          title: `${preferences.clientName}'s ${preferences.destination} Trip`,
          client_name: preferences.clientName,
          destination: preferences.destination,
          user_id: userId,
          team_id: teamId,
          generated_by: userId,
          preferences,
          days: generated.days,
          date_created: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      if (!data) throw new Error('Failed to save itinerary');

      // Increment usage after successful save
      await tierManager.incrementUsage('itineraries');

      return data as SavedItinerary;
    } catch (error) {
      console.error('Error in generateItinerary:', error);
      if (error instanceof Error && error.message.includes('limit')) {
        toast.error(error.message);
      }
      throw error;
    }
  }

  async getUserItineraries(userId: string): Promise<SavedItinerary[]> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await this.supabase
        .from('itineraries')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      toast.error('Failed to fetch itineraries');
      throw error;
    }
  }

  async getItineraryById(id: string): Promise<SavedItinerary | null> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await this.supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .eq('team_id', teamId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      toast.error('Failed to fetch itinerary');
      throw error;
    }
  }

  async updateItinerary(id: string, updates: Partial<SavedItinerary>): Promise<SavedItinerary> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      // Always update the updated_at timestamp
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('itineraries')
        .update(updatedData)
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update itinerary');

      return data as SavedItinerary;
    } catch (error) {
      toast.error('Failed to update itinerary');
      throw error;
    }
  }

  async deleteItinerary(id: string): Promise<void> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { error } = await this.supabase
        .from('itineraries')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      toast.error('Failed to delete itinerary');
      throw error;
    }
  }
}

export const itineraryService = {
  async generate(preferences: TripPreferences, userId: string): Promise<SavedItinerary> {
    try {
      // Check if user can create more itineraries
      if (!tierManager.canCreateItinerary()) {
        throw new Error(tierManager.getLimitReachedMessage('itineraries'));
      }

      // Ensure user has a team
      await ensureUserHasTeam();

      // Generate itinerary using Gemini
      const generated = await gemini.generateItinerary(preferences);

      // Get current timestamp in ISO format
      const now = new Date().toISOString();

      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      // Save to Supabase
      const { data, error } = await supabase
        .from('itineraries')
        .insert({
          title: `${preferences.clientName}'s ${preferences.destination} Trip`,
          client_name: preferences.clientName,
          destination: preferences.destination,
          user_id: userId,
          team_id: teamId,
          generated_by: userId,
          preferences,
          days: generated.days,
          date_created: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      if (!data) throw new Error('Failed to save itinerary');

      // Increment usage after successful save
      await tierManager.incrementUsage('itineraries');

      return data as SavedItinerary;
    } catch (error) {
      console.error('Error in generate:', error);
      if (error instanceof Error && error.message.includes('limit')) {
        toast.error(error.message);
      }
      throw error;
    }
  },

  async getById(id: string): Promise<SavedItinerary | null> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .eq('team_id', teamId)
        .single();

      if (error) throw error;
      return data as SavedItinerary;
    } catch (error) {
      console.error('Error getting itinerary by ID:', error);
      throw error;
    }
  },

  async list(userId: string): Promise<SavedItinerary[]> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('itineraries')
        .select()
        .eq('team_id', teamId)
        .order('date_created', { ascending: false });

      if (error) throw error;
      return (data || []) as SavedItinerary[];
    } catch (error) {
      console.error('Error listing itineraries:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<SavedItinerary>): Promise<SavedItinerary> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      // Always update the updated_at timestamp
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('itineraries')
        .update(updatedData)
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update itinerary');

      return data as SavedItinerary;
    } catch (error) {
      console.error('Error updating itinerary:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Get user's team ID
      const teamId = await getCurrentUserTeamId();

      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      throw error;
    }
  }
};

export async function saveItinerary(
  itinerary: GeneratedItinerary,
  preferences: TripIntake,
  userId: string
): Promise<SavedItinerary | null> {
  try {
    // Check if user can create more itineraries
    if (!tierManager.canCreateItinerary()) {
      throw new Error(tierManager.getLimitReachedMessage('itineraries'));
    }

    // Ensure user has a team
    await ensureUserHasTeam();

    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        team_id: teamId,
        title: itinerary.title,
        client_name: itinerary.clientName,
        destination: itinerary.destination,
        generated_by: userId,
        date_created: new Date().toISOString(),
        preferences: preferences as any,
        days: itinerary.days as any,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving itinerary:', error);
      
      // Handle specific error types
      if (error.code === '403') {
        console.error('Access denied saving itinerary. This could be due to:');
        console.error('1. Missing RLS policies');
        console.error('2. User not authenticated');
        console.error('3. Incorrect user ID format');
        throw new Error('Access denied. Please check your authentication and try again.');
      } else if (error.code === '42703' || error.code === '42P01') {
        console.error('Itineraries table not found. Please run the database setup script.');
        throw new Error('Database not properly configured. Please contact support.');
      } else if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Itinerary with this name already exists. Please choose a different title.');
      } else {
        throw error;
      }
    }

    // Increment usage after successful save
    await tierManager.incrementUsage('itineraries');

    return data;
  } catch (error) {
    console.error('Failed to save itinerary:', error);
    if (error instanceof Error && error.message.includes('limit')) {
      toast.error(error.message);
    }
    throw error;
  }
}

export async function loadItineraries(userId: string): Promise<SavedItinerary[]> {
  try {
    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading itineraries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to load itineraries:', error);
    throw error;
  }
}

export async function loadAllItineraries(): Promise<SavedItinerary[]> {
  try {
    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading all itineraries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to load all itineraries:', error);
    throw error;
  }
}

export async function loadItinerary(id: string): Promise<SavedItinerary> {
  try {
    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .eq('team_id', teamId)
      .single();

    if (error) {
      console.error('Error loading itinerary:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Itinerary not found');
    }

    return data;
  } catch (error) {
    console.error('Failed to load itinerary:', error);
    throw error;
  }
}

export async function updateItinerary(
  id: string,
  updates: Partial<{
    title: string;
    days: GeneratedItinerary['days'];
    preferences: TripIntake;
  }>
): Promise<SavedItinerary | null> {
  try {
    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { data, error } = await supabase
      .from('itineraries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Error updating itinerary:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to update itinerary:', error);
    throw error;
  }
}

export async function deleteItinerary(id: string): Promise<void> {
  try {
    // Get user's team ID
    const teamId = await getCurrentUserTeamId();

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('team_id', teamId);

    if (error) {
      console.error('Error deleting itinerary:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete itinerary:', error);
    throw error;
  }
} 