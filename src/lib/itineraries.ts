import { supabase } from './supabase';
import type { Itinerary, TripPreferences } from '@/types';

export const itineraries = {
  async create(preferences: TripPreferences, userId: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        title: `${preferences.destination} Trip`,
        client_name: preferences.clientName,
        destination: preferences.destination,
        generated_by: userId,
        preferences,
        days: [], // Will be populated by Gemini
        date_created: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async list(userId: string) {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('generated_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Itinerary>) {
    const { data, error } = await supabase
      .from('itineraries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
}; 